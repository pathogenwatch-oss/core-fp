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

  _compareAlleles(query, reference) {
    logger("trace")("Comparing alleles of gene between query and reference");
    const differences = [];
    _.forEach(query, queryAllele => {
      _.forEach(reference, referenceAllele => {
        const { id: queryId, muts: queryMutations } = queryAllele;
        const { qR: [qStart, qEnd] } = queryAllele;
        const queryLength = Math.abs(qStart - qEnd) + 1;
        const { id: referenceId, muts: referenceMutations } = referenceAllele;
        const difference = this._compareMutations(
          queryMutations,
          referenceMutations
        );
        differences.push([queryId, referenceId, difference, queryLength]);
      });
    });
    const sortedDistances = _.sortBy(differences, [2]);
    const pairedQueries = new Set();
    const pairedReferences = new Set();
    let totalDifferences = 0;
    let allelesCompared = 0;
    const bestMatches = {};
    _.forEach(
      sortedDistances,
      ([queryId, referenceId, difference, queryLength]) => {
        if (!_.has(bestMatches, queryId))
          bestMatches[queryId] = {
            length: queryLength,
            variance: difference,
            bestRefAllele: referenceId
          };
        if (pairedQueries.has(queryId) || pairedReferences.has(referenceId))
          return;
        pairedQueries.add(queryId);
        pairedReferences.add(referenceId);
        totalDifferences += difference;
        allelesCompared += 1;
      }
    );
    return { allelesCompared, differences: totalDifferences, bestMatches };
  }

  _compare(queryCoreProfile, referenceCoreProfile) {
    logger("debug")("Comparing genes from query with reference");
    let totalDifferences = 0;
    let basesCompared = 0;
    const alleleDifferences = {};
    _.forEach(
      referenceCoreProfile,
      ({ alleles: refAlleles, refLength }, gene) => {
        const queryAlleles = _.get(queryCoreProfile, [gene, "alleles"], null);
        if (queryAlleles === null) return;
        const {
          allelesCompared,
          differences,
          bestMatches
        } = this._compareAlleles(queryAlleles, refAlleles);
        basesCompared += allelesCompared * refLength;
        totalDifferences += differences;
        alleleDifferences[gene] = bestMatches;
      }
    );
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