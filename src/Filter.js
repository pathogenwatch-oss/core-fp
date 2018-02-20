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

  _compareAlleles(queryAllele, referenceAllele) {
    logger("trace")("Comparing allele from query and reference");
    const { muts: queryMutations } = queryAllele;
    const { muts: referenceMutations } = referenceAllele;
    const overlap = this._overlap(queryAllele, referenceAllele);
    const [start, end] = overlap;
    const length = end - start + 1;
    const difference = this._compareMutations(
      queryMutations,
      referenceMutations,
      overlap
    );
    return { difference, length };
  }

  _compare(queryCoreProfile, referenceCoreProfile) {
    logger("debug")("Comparing genes from query with reference");
    let totalDifferences = 0;
    let basesCompared = 0;
    const alleleDifferences = {};
    _.forEach(referenceCoreProfile, ({ alleles: refAlleles }, gene) => {
      if (refAlleles.length !== 1) return;
      const refAllele = refAlleles[0];
      const { id: refId } = refAllele;

      const queryAlleles = _.get(queryCoreProfile, [gene, "alleles"], []);
      if (queryAlleles.length !== 1) return;
      const queryAllele = queryAlleles[0];
      const { id: queryId } = queryAllele;

      const { difference, length } = this._compareAlleles(
        queryAllele,
        refAllele
      );
      basesCompared += length;
      totalDifferences += difference;
      _.setWith(
        alleleDifferences,
        [gene, queryId],
        {
          length,
          variance: difference,
          bestRefAllele: refId
        },
        Object
      );
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

    function acceptableVariance(allele) {
      // Compare the number of variances with the number we would expect
      // for an allele of this size with the observed mutation rate.
      const { length, variance } = allele;
      const expectedVariations = Math.round(Math.max(1, length * mutationRate));
      const varianceLikelihood = cdf(variance, {
        lambda: expectedVariations
      });
      if (varianceLikelihood < threshold) return false;
      if (varianceLikelihood > 1 - threshold) return false;
      return true;
    }

    _.forEach(queryCoreProfile, ({ alleles: queryAlleles }, gene) => {
      let alleleIdToKeep = null;
      if (_.keys(alleleDifferences[gene] || {}).length === 1) {
        // We want to filter out alleles if there is more than one of them
        // for a given gene family or if there are an unexpented number of
        // variances between it and it's closes reference.
        const onlyAlleleDifference = _.values(alleleDifferences[gene])[0];
        if (acceptableVariance(onlyAlleleDifference))
          alleleIdToKeep = _.keys(alleleDifferences[gene])[0];
      }
      _.forEach(queryAlleles, allele => {
        const { id: alleleId } = allele;
        if (allele.id === alleleIdToKeep) return;
        const { variance } = _.get(alleleDifferences, [gene, allele.id], {});
        const filteredAllele = {
          familyId: gene,
          alleleId
        };
        if (variance) filteredAllele.variance = variance;
        filteredAlleles.push(filteredAllele);
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
