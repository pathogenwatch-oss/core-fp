const _ = require("lodash");
const hasha = require("hasha");
const logger = require("debug");

class Core {
  constructor(config) {
    this.config = config;
  }

  _compliment(sequence) {
    const baseMap = {
      "A": "T",
      "C": "G",
      "G": "C",
      "T": "A",
      "a": "t",
      "c": "g",
      "g": "c",
      "t": "a"
    };
    return _(sequence.split(""))
      .map(c => baseMap[c] || c)
      .reverse()
      .join("");
  }


  _hashSequence(sequence) {
    const upper = sequence.toUpperCase();
    const normalised = upper.replace(/\s|\.|-/g, ""); // Remove whitespace, periods, and dashes
    return hasha(normalised, { algorithm: "sha1" });
  }

  addQueryHash(hit) {
    const { reverse } = hit;
    const querySequence = reverse
      ? this._compliment(hit.querySequence)
      : hit.querySequence;
    hit.queryHash = this._hashSequence(querySequence);
  }

  // Examples of mutations you'd get given different alignments

  //       123456789
  // Ref   TTT--TTTT
  // A     TTT--ATTT    {t: "S", wt: "T",  mut: "A",   rI: 4, qI: 4}
  // B     TTT--AATT    {t: "S", wt: "TT", mut: "AA",  rI: 4, qI: 4}
  // C     TTTA-TTTT    {t: "I", wt: "-",  mut: "A",   rI: 3, qI: 4}
  // D     TTTAATTTT    {t: "I", wt: "--", mut: "AA",  rI: 3, qI: 4}
  // E     TTT---TTT    {t: "D", wt: "T",  mut: "-",   rI: 4, qI: 3}
  // F     TTT----TT    {t: "D", wt: "TT", mut: "--",  rI: 4, qI: 3}

  // Example of mutation you'd get for a given query, reference,
  // and Blast alignment

  //       000000000111111111122222222223
  //       123456789012345678901234567890
  // Query AAAAAAAAAACCTCCCCCCCAAAAAAAAAA
  //                   ^

  //       0000000001
  //       1234567890
  // Ref   GGGGGGGGGG

  // Blast Alignment:
  // Ref / Hit CCCCCCCCCC Start: 10 End: 1
  // Query     CCTCCCCCCC Start: 11 End: 20

  // Mutation  {t: "S", wt: "G", mut: "A", rI: 8, qI: 13}

  addMutations(hit) {
    const { hitSequence, hitStart, reverse } = hit;
    const { querySequence, queryStart, queryEnd } = hit;
    let mutations;
    if (reverse) {
      mutations = this._compareAlignment(
        this._compliment(hitSequence),
        this._compliment(querySequence)
      );
    } else {
      mutations = this._compareAlignment(hitSequence, querySequence);
    }
    hit.mutations = mutations;
    _.forEach(mutations, m => {
      const { refOffset, queryOffset } = m;
      m.rI = hitStart + refOffset;
      m.qI = reverse ? queryEnd - queryOffset : queryStart + queryOffset;
      delete m.refOffset;
      delete m.queryOffset;
    });
    delete hit.hitSequence;
    delete hit.querySequence;
  }

  _compareAlignment(refSequence, querySequence) {
    const newMutation = (type, refBase, refOffset, queryBase, queryOffset) => {
      return {
        t: type,
        wt: refBase, // Wild Type aka reference sequence
        mut: queryBase, // Mutation aka query sequence
        refOffset,
        queryOffset,
        refEnd: refBase == "-" ? refOffset : refOffset + 1,
        queryEnd: queryBase == "-" ? queryOffset : queryOffset + 1
      }
    }

    // Find just the variant positions
    const variants = [];
    let refOffset = -1;
    let queryOffset = -1;
    _.forEach(refSequence, (refBase, idx) => {
      const queryBase = querySequence[idx];
      if (refBase !== "-") refOffset += 1;
      if (queryBase !== "-") queryOffset += 1;
      if (refBase === queryBase) {
        // Nothing
      } else if (queryBase === "-") {
        variants.push(
          newMutation("D", refBase, refOffset, queryBase, queryOffset)
        );
      } else if (refBase === "-") {
        variants.push(
          newMutation("I", refBase, refOffset, queryBase, queryOffset)
        );
      } else {
        // They're different
        variants.push(
          newMutation("S", refBase, refOffset, queryBase, queryOffset)
        );
      }
    });

    const mergeMutations = (a, b) => {
      const { refEnd, queryEnd } = a;
      if (
        _.isEqual(
          [a.t, b.t, refEnd, queryEnd],
          ["S", "S", b.refOffset, b.queryOffset]
        )
      ) {
        // Substition
      } else if (
        _.isEqual(
          [a.t, b.t, refEnd, queryEnd],
          ["D", "D", b.refOffset, b.queryOffset]
        )
      ) {
        // Deletion
      } else if (
        _.isEqual(
          [a.t, b.t, refEnd, queryEnd],
          ["I", "I", b.refOffset, b.queryOffset]
        )
      ) {
        // Insertion
      } else {
        return false;
      }
      a.wt = a.wt + b.wt;
      a.mut = a.mut + b.mut;
      a.refEnd = b.refEnd;
      a.queryEnd = b.queryEnd;
      return true;
    };

    // Walk the variant positions and join them into mutations
    const mutations = [];
    let currentMutation = newMutation(null);
    _.forEach(variants, nextMutation => {
      if (currentMutation.t === null) {
        currentMutation = nextMutation;
        return;
      }
      const merged = mergeMutations(currentMutation, nextMutation);
      if (!merged) {
        delete currentMutation.refEnd;
        delete currentMutation.queryEnd;
        mutations.push(currentMutation);
        currentMutation = nextMutation;
      }
    });
    if (currentMutation.t !== null) {
      delete currentMutation.refEnd;
      delete currentMutation.queryEnd;
      mutations.push(currentMutation);
    };
    return mutations;
  }

  tagShortHits(hits) {
    const minMatchCoveragePercent = (this.config.minMatchCoverage || 80) / 100;
    const { geneLengths } = this.config;
    const minMatchCoverage = _.mapValues(
      geneLengths,
      length => length * minMatchCoveragePercent
    );
    _.forEach(hits, hit => {
      if (hit.tags) return;
      const { hitId, hitStart, hitEnd } = hit;
      if (Math.abs(hitStart - hitEnd) + 1 < (minMatchCoverage[hitId] || 0)) {
        logger("trace:removeHit:short")(hit);
        hit.tags = { type: "shortHit", minMatchCoverage: minMatchCoverage[hitId] };
      }
    });
  }

  isCompleteMatch(hit) {
    const { hitId, hitStart, hitEnd } = hit;
    return Math.abs(hitStart - hitEnd) + 1 === this.config.geneLengths[hitId];
  }

  getHitStats(hits) {
    const { geneLengths } = this.config;
    const numberOfGenes = _.keys(geneLengths).length;
    let completeAlleles = 0;
    let totalMatchLength = 0;

    const matchLength = ({ queryStart, queryEnd }) =>
      Math.abs(queryEnd - queryStart + 1);

    const familiesMatchedSet = new Set();
    _.forEach(hits, hit => {
      const { hitId } = hit;
      familiesMatchedSet.add(hitId);
      if (this.isCompleteMatch(hit)) completeAlleles += 1;
      totalMatchLength += matchLength(hit);
    });
    const [familiesMatched, kernelSize] = [
      familiesMatchedSet.size,
      hits.length
    ];
    const percentKernelMatched =
      Math.round(1000 * (familiesMatched / numberOfGenes)) / 10;
    return {
      familiesMatched,
      completeAlleles,
      kernelSize,
      percentKernelMatched,
      totalMatchLength
    };
  }

  _formatHit(hit) {
    const { hitStart, hitEnd, queryStart, queryEnd } = hit;
    const rR = hitStart <= hitEnd ? [hitStart, hitEnd] : [hitEnd, hitStart];
    const qR =
      queryStart <= queryEnd ? [queryStart, queryEnd] : [queryEnd, queryStart];
    return {
      id: hit.queryHash,
      muts: hit.mutations,
      full: this.isCompleteMatch(hit),
      qId: hit.queryId,
      qR,
      rR,
      pid: hit.pIdent,
      evalue: hit.eValue,
      r: hit.reverse
    };
  }

  _formatAlleles(gene, hits) {
    // Formats the hits against a given gene family
    const { geneLengths } = this.config;
    return {
      alleles: _.map(hits, hit => this._formatHit(hit)),
      refLength: geneLengths[gene]
    };
  }

  formatCoreProfile(hits) {
    const byGene = _.groupBy(hits, "hitId");
    const output = {};
    _.forEach(byGene, (alleles, gene) => {
      if (alleles.length >= 1)
        output[gene] = this._formatAlleles(gene, alleles);
    });
    return output;
  }

  _removeTaggedHits(hits) {
    _.remove(hits, hit => hit.tags);
  }

  getCore(hits, summaryData) {
    logger("debug")("Calculating the core profile");
    const { assemblyId, speciesId, queryLength } = summaryData;
    this.tagShortHits(hits);
    this._removeTaggedHits(hits);
    _.forEach(hits, hit => {
      this.addQueryHash(hit);
      this.addMutations(hit);
    });
    const {
      familiesMatched,
      completeAlleles,
      kernelSize,
      percentKernelMatched,
      totalMatchLength
    } = this.getHitStats(hits);
    const percentAssemblyMatched =
      Math.round(1000 * (totalMatchLength / queryLength)) / 10;
    const coreSummary = {
      assemblyId,
      speciesId,
      familiesMatched, // Genes with one or more hit
      completeAlleles, // Genes with one of more hit against the full reference
      kernelSize, // Number of hits in coreProfile
      percentKernelMatched, // familiesMatched / number of genes families for scheme
      percentAssemblyMatched // Total length of all matches (including duplicates, overlaps deletions) divided by the total number of bases in the query sequence
    };
    const coreProfile = this.formatCoreProfile(hits);
    return {
      coreSummary,
      coreProfile: {
        id: assemblyId, // Duplication of coreSummary.assemblyId
        size: kernelSize, // Duplication of coreSummary.kernelSize
        nt: totalMatchLength, // Total length of all matches (including duplicates, overlaps deletions)
        coreProfile
      }
    };
  }
}

module.exports = { Core };
