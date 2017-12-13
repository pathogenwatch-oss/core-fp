const _ = require("lodash");

class Core {
  constructor(config) {
    this.config = config;
  }

  _pIdent(hit) {
    // Percentage identity of the hit
    const { matchingBases, alignmentLength } = hit;
    return 100 * (matchingBases / alignmentLength);
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
    }
    return _(sequence.split(""))
      .map(c => baseMap[c] || c)
      .reverse()
      .join("");
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
      m.rI = reverse ? hitStart + refOffset : hitStart + refOffset;
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
        queryOffset
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
      const refEnd = a.wt.length + a.refOffset - 1;
      const queryEnd = a.mut.length + a.queryOffset - 1;
      if (
        _.isEqual(
          [a.t, b.t, refEnd + 1, queryEnd + 1],
          ["S", "S", b.refOffset, b.queryOffset]
        )
      ) {
        // Substition
      } else if (
        _.isEqual(
          [a.t, b.t, refEnd + 1, queryEnd],
          ["D", "D", b.refOffset, b.queryOffset]
        )
      ) {
        // Deletion
      } else if (
        _.isEqual(
          [a.t, b.t, refEnd, queryEnd + 1],
          ["I", "I", b.refOffset, b.queryOffset]
        )
      ) {
        // Insertion
      } else {
        return false;
      }
      a.wt = a.wt + b.wt;
      a.mut = a.mut + b.mut;
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
        mutations.push(currentMutation);
        currentMutation = nextMutation;
      }
    });
    if (currentMutation.t !== null) mutations.push(currentMutation);
    return mutations;
  }

  _removeOverlappingHits(hits) {
    // this version takes 0.2 - 0.3 seconds
    const hitsOverlap = (hitA, hitB) => {
      if (hitA.queryId !== hitB.queryId) return 0;
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
    const overlaped = new Set();
    _.forEach(_.groupBy(hits, "queryId"), contigHits => {
      _.forEach(contigHits, (hitA, idx) => {
        _.forEach(contigHits.slice(idx + 1), hitB => {
          const overlap = hitsOverlap(hitA, hitB);
          if (overlap >= 40) {
            if (hitA.pIdent !== hitB.pIdent) {
              overlaped.add(hitA.pIdent < hitB.pIdent ? hitA : hitB);
            } else if (hitA.matchingBases !== hitB.matchingBases) {
              overlaped.add(
                hitA.matchingBases < hitB.matchingBases ? hitA : hitB
              );
            } else if (hitA.hitId !== hitB.hitId) {
              // Keep the alphanumerically smaller
              overlaped.add(hitA.hitId > hitB.hitId ? hitA : hitB);
            } else if (hitA.queryStart !== hitB.queryStart) {
              // Keep the one which starts first
              overlaped.add(hitA.queryStart > hitB.queryStart ? hitA : hitB);
            } else if (hitA.queryEnd !== hitB.queryEnd) {
              // Keep the one which ends first
              overlaped.add(hitA.queryEnd > hitB.queryEnd ? hitA : hitB);
            } else {
              // Keep the first one in the list (they're essentially duplicates)
              overlaped.add(hitB);
            }
          }
        });
      });
    });
    _.remove(hits, hit => overlaped.has(hit));
  }

  _removeShortHits(hits) {
    const minMatchCoverage = this.config.minMatchCoverage || 80;
    _.remove(
      hits,
      ({ hitStart, hitEnd }) => Math.abs(hitStart - hitEnd) < minMatchCoverage
    );
  }

  _removePartialHits(hits) {
    // If a gene family has a hit which matches the whole gene, use that and discard any partial matches
    const isCompleteMatch = ({ hitId, hitStart, hitEnd }) =>
      Math.abs(hitStart - hitEnd) + 1 === this.config.geneLengths[hitId];
    const complete = new Set();
    _.forEach(hits, hit => {
      if (isCompleteMatch(hit)) {
        complete.add(hit.hitId);
        hit.full = true;
      } else {
        hit.full = false;
      }
    });
    _.remove(hits, hit => complete.has(hit.hitId) && !hit.full);
  }

  getFamiliesWithHits(hits) {
    return hits.reduce((families, { hitId }) => families.add(hitId), new Set());
  }

  getCore(hits, summaryData) {
    const { assemblyId, speciesId } = summaryData;
    this._removePartialHits(hits);
    this._removeShortHits(hits);
    this._removeOverlappingHits(hits);
    _.forEach(hits, hit => this.addMutations(hit));
    const familiesMatches = this.getFamiliesWithHits(hits).size;
    const coreSummary = {
      assemblyId,
      speciesId,
      familiesMatches
    };
    return {
      coreSummary,
      coreProfile: {
        coreProfile: _.groupBy(hits, "hitId")
      }
    };
  }
}

module.exports = { Core };
