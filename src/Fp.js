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

  addCore(name, coreProfile) {
    logger("debug")(`Reformatting substitution mutations for ${name}`);
    // This function is used to index the references and the query
    // sequence.  It takes a coreProfile and reformats the relevant details
    // of the substitution mutations.
    const bounds = {};
    _.forEach(coreProfile, ({ alleles }, gene) => {
      // If an gene familiy has multiple hits in a reference or query
      // we discard all but the one with fewest substitution
      // mutations (ignoring how long those substitutions are)
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
          // We record the range of the gene family matched so that
          // we can ignore mutations in the reference outside this
          // range during fingerprinting
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
    logger("debug")(`Formatting substitutions for output`);
    // Reformat the substitutions so that they can be saved as JSON and
    // make them easier to query later.
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

  _score(allReferences, referenceProfile, bounds) {
    logger("debug")(`Comparing against reference profiles`);
    // Score is a comparison of substitution mutations between a query
    // and each of the references.  It doesn't matter how many bases
    // are part of the substitution mutation, they're only counted
    // once.  If a query (or reference) sequence has more than one
    // match for a given gene family, only the matches with the fewest
    // substitution mutations (relative to the core genome) is assessed.

    // The score is incremented for a reference if it has the same
    // substitution as a query or if they both lack a substitution in
    // that position.

    // This is the same for all scores.  It is the number of substitution
    // positions in the referenceProfile which are considered during
    // scoring.  It excludes positions which occur outside the query
    // sequence match.
    let countedSites = 0;

    const scores = _(allReferences)
      .map(referenceId => ({
        referenceId,
        matchedSites: 0
      }))
      .keyBy("referenceId")
      .value();

    _.forEach(referenceProfile, (variantPostions, gene) => {
      const [lowerBound, upperBound] = bounds[gene] || [0, 0];
      _.forEach(variantPostions, ({ rI: position, muts: mutations }) => {
        if (position < lowerBound) return;
        else if (position > upperBound) return;
        const queryMutation =
          _.keys(_.get(this.substitutions, [gene, position], {}))[0] || null;
        // There should only ever be one substitution in a given position
        // because only one allele is used and there should only be one
        // query sequence.

        const referencesWithSameMutation = new Set();
        if (queryMutation === null) {
          _.forEach(allReferences, referenceId => {
            // If the query doesn't have any substitutions we'll increment
            // the score of all the references which also lack substitutions
            // in this position.
            referencesWithSameMutation.add(referenceId);
          });
        }

        _.forEach(mutations, (references, mutation) => {
          _.forEach(references, referenceId => {
            if (queryMutation === mutation)
              referencesWithSameMutation.add(referenceId);
            else referencesWithSameMutation.delete(referenceId);
          });
        });

        _.forEach([...referencesWithSameMutation], referenceId => {
          // Matching sites is incremented for the given reference if
          // there is an identical substitution mutation in the query
          // sequence in the same position for a given gene family
          scores[referenceId].matchedSites += 1;
        });

        countedSites += 1;
      });
    });
    _.forEach(scores, score => {
      const { matchedSites } = score;
      score.countedSites = countedSites; // eslint-disable-line no-param-reassign
      // The score itself is the number of matches between a query and the
      // reference divided by the number of substitution mutations which
      // were considered.
      score.score = matchedSites / countedSites; // eslint-disable-line no-param-reassign
    });
    return _.values(scores);
  }

  _sortScores(scores) {
    logger("debug")("Sorting the FP scores");
    // Sort by highest score (i.e. matching substitutions)
    // If two references have the same score return the first alphabetically
    return scores.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      else if (a.referenceId <= b.referenceId) return -1;
      return 1;
    });
  }

  // eslint-disable-next-line
  static calculateFp(coreProfile, referenceDetails, summaryData) {
    // Given a query sequence, fingerprint it against pre-profiled
    // references.  Format it for output.
    const {
      referenceProfile,
      referenceNames,
      fingerprintSize
    } = referenceDetails;
    const { assemblyId, speciesId } = summaryData;
    logger("debug")(`Calculating the FP for ${assemblyId}`);
    const fp = new this({});
    const bounds = fp.addCore(assemblyId, coreProfile);
    const unsortedScores = fp._score(referenceNames, referenceProfile, bounds);
    const scores = fp._sortScores(unsortedScores);
    const { referenceId: subTypeAssignment } = scores[0];
    return {
      assemblyId, // Name of the query sequence
      speciesId, // Species of the query
      subTypeAssignment, // Reference with the lowest score
      scores, // The scores for each reference
      fingerprintSize // Total number of unique positions across all of the references where substitutions occur
    };
  }
}

module.exports = { Fp };
