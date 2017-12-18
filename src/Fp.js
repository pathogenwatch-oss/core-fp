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
          this.substitutions[gene] = this.substitutions[gene] || {};
          this.substitutions[gene][rI] = this.substitutions[gene][rI] || {};
          this.substitutions[gene][rI][mut] =
            this.substitutions[gene][rI][mut] || new Set();
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

  compare(referenceProfile, bounds) {
    return {};
  }
}

module.exports = { Fp };
