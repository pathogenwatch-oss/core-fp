const _ = require("lodash");
const logger = require("debug");

class Filter {
  compare(queryCore, referenceCore) {
    return {};
  }

  _compareMutations(first, second) {
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

  compare(queryCoreProfile, referenceCoreProfile) {
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
}

module.exports = { Filter };
