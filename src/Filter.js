const _ = require("lodash");
const logger = require("debug");
const cdf = require("distributions-poisson-cdf");

class Filter {
  _compareMutations(first, second, overlap) {
    logger("trace")(
      "Measuring the number of different substitutions between alleles"
    );
    const [start, end] = overlap;
    const firstPositions = _(first)
      .filter(({ t, rI }) => t === "S" && rI >= start && rI <= end)
      .keyBy("rI")
      .value();
    const secondPositions = _(second)
      .filter(({ t, rI }) => t === "S" && rI >= start && rI <= end)
      .keyBy("rI")
      .value();
    const mutationPositons = new Set([
      ..._.keys(firstPositions),
      ..._.keys(secondPositions)
    ]);
    let variants = 0;

    _.forEach([...mutationPositons], rI => {
      const { mut: firstMutation } = firstPositions[rI] || { mut: null };
      const { mut: secondMutation } = secondPositions[rI] || { mut: null };
      if (firstMutation !== secondMutation) variants += 1;
    });
    return variants;
  }

  _overlap(alleleA, alleleB) {
    function bounds(allele) {
      const { rR } = allele;
      return rR[0] < rR[1] ? rR : rR.reverse();
    }
    const [aStart, aEnd] = bounds(alleleA);
    const [bStart, bEnd] = bounds(alleleB);
    const sorted = [aStart, bStart, aEnd, bEnd].sort((a, b) => a - b);

    if (bStart === aEnd) return [aEnd, bStart];
    else if (aStart === bEnd) return [bEnd, aStart];
    else if (_.isEqual(sorted, [aStart, aEnd, bStart, bEnd])) return null;
    else if (_.isEqual(sorted, [bStart, bEnd, aStart, aEnd])) return null;
    else if (_.isEqual(sorted, [aStart, bStart, aEnd, bEnd]))
      return sorted.slice(1, 3);
    else if (_.isEqual(sorted, [bStart, aStart, bEnd, aEnd]))
      return sorted.slice(1, 3);
    else if (_.isEqual(sorted, [aStart, bStart, bEnd, aEnd]))
      return sorted.slice(1, 3);
    else if (_.isEqual(sorted, [bStart, aStart, aEnd, bEnd]))
      return sorted.slice(1, 3);
    return null;
  }

  _permutations(allAs, allBs) {
    const output = [];
    const permutationLength = Math.min(allAs.length, allBs.length);
    const recurse = (acc, remainingAs, remainingBs) => {
      if (acc.length === permutationLength) output.push(acc);
      _.forEach(remainingAs, (a, ai) => {
        _.forEach(remainingBs, (b, bi) => {
          const nextAs = remainingAs.slice(ai + 1);
          const nextBs = [
            ...remainingBs.slice(0, bi),
            ...remainingBs.slice(bi + 1)
          ];
          recurse([...acc, [a, b]], nextAs, nextBs);
        });
      });
    };
    recurse([], allAs, allBs);
    return output;
  }

  _compareAlleles(query, reference) {
    logger("trace")("Comparing alleles of gene between query and reference");
    const differences = {};
    _.forEach(query, queryAllele => {
      _.forEach(reference, referenceAllele => {
        const { id: queryId, muts: queryMutations } = queryAllele;
        const { id: referenceId, muts: referenceMutations } = referenceAllele;
        const overlap = this._overlap(queryAllele, referenceAllele);
        const [start, end] = overlap;
        const length = end - start + 1;
        const difference = this._compareMutations(
          queryMutations,
          referenceMutations,
          overlap
        );
        _.setWith(
          differences,
          [referenceId, queryId],
          [difference, length],
          Object
        );
      });
    });

    const referenceIds = _.map(reference, ({ id }) => id).sort();
    const queryIds = _.map(query, ({ id }) => id).sort();
    let bestPermutation = null;
    let bestPermutationScores = null;

    function assessPermutation(permutation) {
      // Given a list of pairs of references and query allele ids
      // work out what their total variance is and the length of
      // the matched regions.
      const [difference, length] = _.reduce(
        permutation,
        ([totalDifference, totalLength], [referenceId, queryId]) => {
          const [d, l] = differences[referenceId][queryId];
          return [totalDifference + d, totalLength + l];
        },
        [0, 0]
      );
      return [difference, length];
    }

    _.forEach(this._permutations(referenceIds, queryIds), permutation => {
      const [difference, length] = assessPermutation(permutation);
      if (bestPermutationScores === null) {
        bestPermutation = permutation;
        bestPermutationScores = [difference, length];
        return;
      }

      const [bestDifference, bestLength] = bestPermutationScores;
      if (bestDifference > difference) {
        bestPermutation = permutation;
        bestPermutationScores = [difference, length];
      } else if (bestDifference === difference && bestLength < length) {
        bestPermutation = permutation;
        bestPermutationScores = [difference, length];
      }
    });

    const bestMatches = {};
    _.forEach(bestPermutation, ([referenceId, queryId]) => {
      const [difference, length] = differences[referenceId][queryId];
      bestMatches[queryId] = {
        length,
        variance: difference,
        bestRefAllele: referenceId
      };
    });
    return bestMatches;
  }

  _compare(queryCoreProfile, referenceCoreProfile) {
    logger("debug")("Comparing genes from query with reference");
    let totalDifferences = 0;
    let basesCompared = 0;
    const alleleDifferences = {};
    _.forEach(referenceCoreProfile, ({ alleles: refAlleles }, gene) => {
      const queryAlleles = _.get(queryCoreProfile, [gene, "alleles"], null);
      if (queryAlleles === null) return;
      const bestMatches = this._compareAlleles(queryAlleles, refAlleles);
      basesCompared += _.reduce(
        bestMatches,
        (total, { length }) => total + length,
        0
      );
      totalDifferences += _.reduce(
        bestMatches,
        (total, { variance }) => total + variance,
        0
      );
      alleleDifferences[gene] = bestMatches;
    });
    const mutationRate = totalDifferences / basesCompared;
    return { mutationRate, alleleDifferences };
  }

  _filter(queryCoreProfile, referenceCoreProfile, threshold) {
    logger("debug")("Filtering alleles with too many/few substitutions");
    const { mutationRate, alleleDifferences } = this._compare(
      queryCoreProfile,
      referenceCoreProfile
    );
    const filteredAlleles = [];
    _.forEach(alleleDifferences, (alleles, gene) => {
      _.forEach(alleles, ({ length, variance }, alleleId) => {
        const expectedVariations = Math.round(
          Math.max(1, length * mutationRate)
        );
        const varianceLikelihood = cdf(variance, {
          lambda: expectedVariations
        });
        if (
          varianceLikelihood < threshold ||
          varianceLikelihood > (1 - threshold)
        )
          filteredAlleles.push({ familyId: gene, alleleId, variance });
      });
    });
    return { filteredAlleles, mutationRate };
  }

  // eslint-disable-next-line max-params
  calculateFilter(referenceId, summaryData, numberGeneFamilies, coreProfiles) {
    const { referenceCoreProfile, queryCoreProfile } = coreProfiles;
    const { assemblyId, speciesId } = summaryData;
    const filterThreshold = 1 / (numberGeneFamilies * 1e6);
    const { filteredAlleles, mutationRate } = this._filter(
      queryCoreProfile,
      referenceCoreProfile,
      filterThreshold
    );
    return {
      assemblyId,
      referenceId,
      speciesId,
      filteredAlleles,
      mutationRate
    };
  }
}

module.exports = { Filter };
