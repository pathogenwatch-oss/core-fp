const _ = require("lodash");
const logger = require("debug");

class Fp {
  constructor(substitutions = {}, bounds = {}) {
    this.substitutions = substitutions;
    this.bounds = bounds;
  }

  genes() {
    logger("debug")("Getting the genes from Fp");
    const allGenes = new Set();
    _.forEach(this.bounds, (geneBounds, __) => {
      _.forEach(geneBounds, (__, gene) => {
        allGenes.add(gene);
      });
    });
    return [...allGenes];
  }

  removeNonUniversalGenes() {
    logger("debug")("Removing non-universal genes");
    // This is used when indexing the references.  NB that it will,
    // in effect, also remove all traces of the haplotypes because
    // they are not added to the bounds properties.
    const geneCounts = {};
    _.forEach(this.bounds, (geneBounds, __) => {
      _.forEach(geneBounds, (__, gene) => {
        geneCounts[gene] = (geneCounts[gene] || 0) + 1;
      });
    });
    const refCount = _.keys(this.bounds).length;
    const nonUniversalGenes = _(geneCounts)
      .toPairs()
      .filter(([__, count]) => count !== refCount)
      .map(([gene, __]) => gene)
      .value();

    logger("trace")(
      `Removing the following genes:\n${nonUniversalGenes.join("\n")}`
    );
    _.forEach(this.bounds, (geneBounds, reference) => {
      const genesInReference = _.keys(geneBounds);
      _.forEach(genesInReference, gene => {
        if (_.includes(nonUniversalGenes, gene)) delete geneBounds[gene];
      });
    });
    const genesInSubstitutions = _.keys(this.substitutions);
    _.forEach(genesInSubstitutions, gene => {
      if (_.includes(nonUniversalGenes, gene)) delete this.substitutions[gene];
    });
  }

  dump() {
    return {
      substitutions: this.substitutions,
      bounds: this.bounds
    };
  }

  static load(data) {
    const { substitutions, bounds } = data;
    return new Fp(substitutions, bounds);
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
      // we discard that family
      if (alleles.length !== 1) return;

      const allele = alleles[0];
      // We record the range of the gene family matched so that
      // we can ignore mutations in the reference outside this
      // range during fingerprinting
      bounds[gene] = allele.rR;
      const mutations = allele.muts || [];
      _.forEach(mutations, ({ t, mut, rI }) => {
        if (t !== "S") return;
        if (!_.has(this.substitutions, [gene, rI, mut]))
          _.setWith(this.substitutions, [gene, rI, mut], [], Object);
        this.substitutions[gene][rI][mut].push(name);
      });
    });
    this.bounds[name] = bounds;
  }

  _score(queryName, queryFp) {
    logger("debug")(`Scoring reference profiles against query`);
    // Score is a comparison of substitution mutations between a query
    // and each of the references.  It doesn't matter how many bases
    // are part of the substitution mutation, they're only counted
    // once.  If a query (or reference) sequence has more than one
    // match for a given gene family, only the matches with the fewest
    // substitution mutations (relative to the core genome) is assessed.

    // The score is incremented for a reference if it has the same
    // substitution as a query or if they both lack a substitution in
    // that position.

    // Mutations which occur within a region which aren't matched in
    // the query or the reference are ignored.

    const queryBounds = queryFp.bounds[queryName];
    const querySubstitutions = {};
    _.forEach(queryFp.substitutions, (substitutionPositions, gene) => {
      _.forEach(substitutionPositions, (substitutions, position) => {
        _.forEach(substitutions, (queries, substitution) => {
          if (_.includes(queries, queryName))
            _.setWith(
              querySubstitutions,
              [gene, position],
              substitution,
              Object
            );
        });
      });
    });

    const referenceNames = _.keys(this.bounds);
    const scores = _(referenceNames)
      .map(referenceId => ({
        referenceId,
        matchedSites: 0,
        countedSites: 0
      }))
      .keyBy("referenceId")
      .value();

    _.forEach(this.substitutions, (substitutionPositions, gene) => {
      const [queryStart, queryEnd] = queryBounds[gene] || [0, 0];
      _.forEach(substitutionPositions, (substitutions, _position) => {
        // We ignore the position if the query had a partial match for
        // the gene and it didn't overlap this region.  We also check
        // that the mutations don't overlap outside the region matched
        // by the query and ignore positions where all mutations are too
        // long to match the query region.
        const position = Number(_position);
        if (position < queryStart) return;
        const substitutionsInBounds = _(substitutions)
          .keys()
          .filter(s => position + s.length - 1 <= queryEnd)
          .value().length;
        if (substitutionsInBounds === 0) return;

        const querySubstitution = _.get(
          querySubstitutions,
          [gene, position],
          null
        );

        // We want to know the number of matching substitutions for each
        // reference.  i.e. if there is a substitution in the query, the
        // reference matches if it has the same substitution.  If the
        // query doesn't have a substitution in this position, all of the
        // references which don't have a substitution there also match.
        const referencesWithSameMutation = new Set();

        _.forEach(referenceNames, referenceId => {
          const [refStart, refEnd] = this.bounds[referenceId][gene] || [0, 0];
          if (position >= refStart && position <= refEnd) {
            scores[referenceId].countedSites += 1; // The query and reference both match this region
            // The query doesn't have a mutation here so we'll add in all of the
            // references and remove those which do have a substitution here.
            if (querySubstitution === null)
              referencesWithSameMutation.add(referenceId);
          }
        });

        _.forEach(substitutions, (references, mutation) => {
          _.forEach(references, referenceId => {
            if (querySubstitution === mutation)
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
      });
    });

    _.forEach(scores, score => {
      const { matchedSites, countedSites } = score;
      // The score itself is the number of matches between a query and the
      // reference divided by the number of substitution mutations which
      // were considered.
      if (countedSites === 0)
        score.score = 0; // eslint-disable-line no-param-reassign
      else score.score = matchedSites / countedSites; // eslint-disable-line no-param-reassign
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
  calculateFp(coreProfile, summaryData) {
    // This is an FP for some reference sequences.  Given a query coreProfile
    // calculate the FP fields of the core profile.
    const { assemblyId, speciesId } = summaryData;
    logger("debug")(`Calculating the FP for ${assemblyId}`);

    const queryFp = new Fp();
    queryFp.addCore(assemblyId, coreProfile);
    const unsortedScores = this._score(assemblyId, queryFp);
    const scores = this._sortScores(unsortedScores);
    const { referenceId: subTypeAssignment } = scores[0];

    const fingerprintSize = this.fingerprintSize();
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
