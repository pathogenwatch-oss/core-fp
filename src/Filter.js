const _ = require("lodash");
const logger = require("debug");
const cdf = require("distributions-poisson-cdf");

class Filter {
  _compareMutations(first, second) {
    logger("trace")(
      "Measuring the number of different substitutions between alleles"
    );
    const firstPositions = _(first)
      .filter(({ t }) => t === "S")
      .keyBy("rI")
      .value();
    const secondPositions = _(second)
      .filter(({ t }) => t === "S")
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
    if (bStart === aEnd || aStart === bEnd) return 1;
    else if (_.isEqual(sorted, [aStart, aEnd, bStart, bEnd])) return 0;
    else if (_.isEqual(sorted, [bStart, bEnd, aStart, aEnd])) return 0;
    else if (_.isEqual(sorted, [aStart, bStart, aEnd, bEnd]))
      return aEnd - bStart + 1;
    else if (_.isEqual(sorted, [bStart, aStart, bEnd, aEnd]))
      return bEnd - aStart + 1;
    else if (_.isEqual(sorted, [aStart, bStart, bEnd, aEnd]))
      return bEnd - bStart + 1;
    else if (_.isEqual(sorted, [bStart, aStart, aEnd, bEnd]))
      return aEnd - aStart + 1;
    return 0;
  }

  _compareAlleles(query, reference) {
    logger("trace")("Comparing alleles of gene between query and reference");
    const differences = [];
    _.forEach(query, queryAllele => {
      _.forEach(reference, referenceAllele => {
        const { id: queryId, muts: queryMutations } = queryAllele;
        const length = this._overlap(queryAllele, referenceAllele);
        const { id: referenceId, muts: referenceMutations } = referenceAllele;
        const difference = this._compareMutations(
          queryMutations,
          referenceMutations
        );
        differences.push([queryId, referenceId, difference, length]);
      });
    });
    const sortedDistances = _.sortBy(differences, [2]);
    const pairedQueries = new Set();
    const pairedReferences = new Set();
    const bestMatches = {};
    _.forEach(sortedDistances, ([queryId, referenceId, difference, length]) => {
      if (pairedQueries.has(queryId) || pairedReferences.has(referenceId))
        return;
      bestMatches[queryId] = {
        length,
        variance: difference,
        bestRefAllele: referenceId
      };
      pairedQueries.add(queryId);
      pairedReferences.add(referenceId);
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
        const expectedVariations = Math.max(1, length * mutationRate);
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
