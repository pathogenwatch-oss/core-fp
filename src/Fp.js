const _ = require("lodash");
const logger = require("debug");

class Fp {
  constructor(substitutions = {}) {
    this.substitutions = substitutions;
  }

  fingerprintSize() {
    let size = 0;
    _.forEach(this.substitutions || {}, positions => {
      size += _.keys(positions).length;
    });
    return size;
  }

  addCore(name, core) {
    const bounds = {};
    _.forEach(core, ({ alleles }, gene) => {
      let fewestSubstitutions = null;
      _.forEach(alleles || [], allele => {
        const { rR } = allele;
        const mutations = allele.muts || [];
        const substitutions = _.filter(mutations, ({ t }) => t === "S");
        if (fewestSubstitutions === null) {
          fewestSubstitutions = substitutions;
          bounds[gene] = rR;
        } else if (substitutions.length < fewestSubstitutions.length) {
          fewestSubstitutions = substitutions;
          bounds[gene] = rR;
        }
      });
      if (fewestSubstitutions !== null) {
        _.forEach(fewestSubstitutions, ({ t, mut, rI }) => {
          if (t !== "S") return;
          if (!_.has(this.substitutions, [gene, rI, mut]))
            _.setWith(this.substitutions, [gene, rI, mut], new Set(), Object);
          this.substitutions[gene][rI][mut].add(name);
        });
      }
    });
    return bounds;
  }

  getProfile() {
    const profile = {};
    _.forEach(this.substitutions, (substitutionPositions, gene) => {
      const positions = _.keys(substitutionPositions).sort((a, b) => a - b);
      profile[gene] = profile[gene] || [];
      _.forEach(positions, position => {
        const mutations = substitutionPositions[position];
        profile[gene].push({
          rI: Number(position),
          muts: _.mapValues(mutations, references => [...references])
        });
      });
    });
    return profile;
  }

  _score(referenceProfile, bounds) {
    let countedSites = 0;
    const scores = {};
    _.forEach(referenceProfile, (variantPostions, gene) => {
      const [lowerBound, upperBound] = bounds[gene] || [0, 0];
      _.forEach(variantPostions, ({ rI: position, muts: mutations }) => {
        if (position < lowerBound) return;
        else if (position > upperBound) return;
        _.forEach(mutations, (references, mutation) => {
          _.forEach(references, referenceId => {
            scores[referenceId] = scores[referenceId] || {
              referenceId,
              matchedSites: 0
            };
          });
          if (_.has(this.substitutions, [gene, position, mutation])) {
            _.forEach(references, referenceId => {
              scores[referenceId].matchedSites += 1;
            });
          }
          countedSites += 1;
        });
      });
    });
    _.forEach(scores, score => {
      const { matchedSites } = score;
      score.countedSites = countedSites;
      score.score = matchedSites / countedSites;
    });
    return _.values(scores);
  }

  _bestScore(scores) {
    return scores.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      else if (a.referenceId <= b.referenceId) return -1;
      else if (a.referenceId > b.referenceId) return 1;
    })[0];
  }
}

module.exports = { Fp };
