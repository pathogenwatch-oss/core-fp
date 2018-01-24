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

  _removeOverlappingHits(hits) {
    // this version takes 0.2 - 0.3 seconds
    const hitsOverlap = (hitA, hitB) => {
      if (hitA.queryId !== hitB.queryId) return 0;
      if (hitA.reverse !== hitB.reverse) return 0;
      const [aStart, aEnd] = [hitA.queryStart, hitA.queryEnd].sort(
        (a, b) => a - b
      );
      const [bStart, bEnd] = [hitB.queryStart, hitB.queryEnd].sort(
        (a, b) => a - b
      );
      const sorted = [aStart, bStart, aEnd, bEnd].sort((a, b) => a - b);
      if (_.isEqual([aStart, aEnd, bStart, bEnd], sorted))
        return aEnd === bStart ? 1 : 0;
      if (_.isEqual([bStart, bEnd, aStart, aEnd], sorted))
        return bEnd === aStart ? 1 : 0;
      if (_.isEqual([aStart, bStart, aEnd, bEnd], sorted))
        return aEnd - bStart + 1;
      if (_.isEqual([aStart, bStart, bEnd, aEnd], sorted))
        return bEnd - bStart + 1;
      if (_.isEqual([bStart, aStart, bEnd, aEnd], sorted))
        return bEnd - aStart + 1;
      if (_.isEqual([bStart, aStart, aEnd, bEnd], sorted))
        return aEnd - aStart + 1;
      throw new Error("Couldn't calculate overlap between hits");
    };
    _.forEach(_.groupBy(hits, "queryId"), contigHits => {
      const unfilteredHits = _.filter(contigHits, hit => !hit.filtered);
      _.forEach(unfilteredHits, (hitA, idx) => {
        _.forEach(unfilteredHits.slice(idx + 1), hitB => {
          const overlap = hitsOverlap(hitA, hitB);
          if (overlap > 40) {
            let removed = null;
            let removedBy = null;
            let removedBecause = null;
            if (hitA.pIdent !== hitB.pIdent) {
              [removed, removedBy] =
                hitA.pIdent < hitB.pIdent ? [hitA, hitB] : [hitB, hitA];
              removedBecause = "pIdent";
            } else if (hitA.matchingBases !== hitB.matchingBases) {
              [removed, removedBy] =
                hitA.matchingBases < hitB.matchingBases
                  ? [hitA, hitB]
                  : [hitB, hitA];
              removedBecause = "matchingBases";
            } else if (hitA.hitId !== hitB.hitId) {
              // Keep the alphanumerically smaller
              [removed, removedBy] =
                hitA.hitId > hitB.hitId ? [hitA, hitB] : [hitB, hitA];
              removedBecause = "hitId";
            } else if (hitA.queryStart !== hitB.queryStart) {
              // Keep the one which starts first
              [removed, removedBy] =
                hitA.queryStart > hitB.queryStart ? [hitA, hitB] : [hitB, hitA];
              removedBecause = "queryStart";
            } else if (hitA.queryEnd !== hitB.queryEnd) {
              // Keep the one which ends first
              [removed, removedBy] =
                hitA.queryEnd > hitB.queryEnd ? [hitA, hitB] : [hitB, hitA];
              removedBecause = "queryEnd";
            } else {
              // Keep the first one in the list (they're essentially duplicates)
              [removed, removedBy, removedBecause] = [hitB, hitA, "second"];
            }
            removed.filtered = {
              type: "overlap",
              by: removedBy.queryHash,
              overlap,
              because: removedBecause
            };
          }
        });
      });
    });
  }

  _removeShortHits(hits) {
    const minMatchCoveragePercent = (this.config.minMatchCoverage || 80) / 100;
    const { geneLengths } = this.config;
    const minMatchCoverage = _.mapValues(
      geneLengths,
      length => length * minMatchCoveragePercent
    );
    _.forEach(hits, hit => {
      if (hit.filtered) return;
      const { hitId, hitStart, hitEnd } = hit;
      if (Math.abs(hitStart - hitEnd) + 1 < (minMatchCoverage[hitId] || 0)) {
        logger("trace:removeHit:short")(hit);
        hit.filtered = { type: "shortHit", minMatchCoverage: minMatchCoverage[hitId] };
      }
    });
  }

  _removePartialHits(hits) {
    // If a gene family has a hit which matches the whole gene, use that and discard any partial matches
    const isCompleteMatch = ({ hitId, hitStart, hitEnd }) =>
      Math.abs(hitStart - hitEnd) + 1 === this.config.geneLengths[hitId];
    const complete = {};
    _.forEach(hits, hit => {
      if (hit.filted) return;
      if (isCompleteMatch(hit)) {
        complete[hit.hitId] = hit.queryHash || "Unknown";
        hit.full = true;
      } else {
        hit.full = false;
      }
    });
    _.forEach(hits, hit => {
      if (hit.filtered) return;
      if (complete[hit.hitId] && !hit.full) {
        logger("trace:removeHit:partial")(hit);
        hit.filtered = { type: "partialHit", by: complete[hit.hitId] };
      }
    });
  }

  getHitStats(hits) {
    const { geneLengths } = this.config;
    const numberOfGenes = _.keys(geneLengths).length;
    let completeAlleles = 0;
    let totalMatchLength = 0;
    const familiesMatchedSet = new Set();
    _.forEach(hits, ({ hitId, full, queryStart, queryEnd }) => {
      familiesMatchedSet.add(hitId);
      if (full) completeAlleles += 1;
      totalMatchLength += Math.abs(queryEnd - queryStart + 1);
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
      full: hit.full,
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
      alleles: _.map(hits, this._formatHit),
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

  _removeFiltered(hits) {
    _.remove(hits, hit => hit.filtered);
  }

  addFilters(hits) {
    logger("debug")("Filtering the core hits");
    this._removePartialHits(hits);
    this._removeShortHits(hits);
    this._removeOverlappingHits(hits);
  }

  getCore(hits, summaryData) {
    logger("debug")("Calculating the core profile");
    const { assemblyId, speciesId, queryLength } = summaryData;
    this.addFilters(hits);
    this._removeFiltered(hits);
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
