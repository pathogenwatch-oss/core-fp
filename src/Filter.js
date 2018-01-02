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
    _.forEach(query, (queryAllele, queryIndex) => {
      _.forEach(reference, (referenceAllele, referenceIndex) => {
        const { muts: queryMutations } = queryAllele;
        const { muts: referenceMutations } = referenceAllele;
        const difference = this._compareMutations(
          queryMutations,
          referenceMutations
        );
        differences.push([queryIndex, referenceIndex, difference]);
      });
    });
    const sortedDistances = _.sortBy(differences, [2]);
    const pairedQueries = new Set();
    const pairedReferences = new Set();
    let totalDifferences = 0;
    let allelesCompared = 0;
    _.forEach(sortedDistances, ([queryIndex, referenceIndex, difference]) => {
      if (pairedQueries.has(queryIndex) || pairedReferences.has(referenceIndex))
        return;
      pairedQueries.add(queryIndex);
      pairedReferences.add(referenceIndex);
      totalDifferences += difference;
      allelesCompared += 1;
    });
    return { allelesCompared, differences: totalDifferences };
  }
}

module.exports = { Filter };
