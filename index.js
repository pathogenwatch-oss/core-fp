const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const logger = require("debug");
const { promisify } = require("util");
const { Writable } = require("stream");
const { parseString: parseXml } = require("xml2js");
const _ = require("lodash");

process.on("unhandledRejection", reason => {
  logger("error:unhandledRejection")(reason);
  process.exit(1);
});

const SCHEME = 485;

async function readConfig(scheme) {
  const schemeConfigPath = path.join(__dirname, "schemes", String(scheme), "config.jsn");
  const contents = await promisify(fs.readFile)(schemeConfigPath);
  return JSON.parse(contents);
}

function defer() {
  // Returns a promise which you can manually resolve or reject
  // using it's "resolve" and "reject" methods
  let _resolve;
  let _reject;
  const p = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });
  p.resolve = _resolve;
  p.reject = _reject;
  return p;
}

class StreamCollector extends Writable {
  // Used to turn streams into strings.  Pipe the stream
  // into one of these and then wait for the "output"
  // Promise to resolve.
  constructor() {
    super();
    this.output = defer();
    this._chunks = [];
  }

  _write(chunk, encoding, done) {
    this._chunks.push(chunk);
    done();
  }

  _final() {
    this.output.resolve(this._chunks.join(""));
  }
}

async function runBlast(blastConfiguration) {
  const BLAST_DB = path.join(__dirname, "databases", String(SCHEME), "core.db");
  const blastCommand = `blastn -task blastn -outfmt 5 -query - -db ${BLAST_DB} -perc_identity ${blastConfiguration.gatheringPid} ` + 
                       `-evalue ${blastConfiguration.gatheringEValue} -num_alignments ${blastConfiguration.maxMatches}`;
  const whenBlastFinished = defer();
  const shell = spawn(blastCommand, { shell: true });

  // If `blastn` doesn't exist, there's a race between the input stream and the
  // spawned process to error.  Look for both.
  shell.stdin.on("error", err => {
    logger("error:blast")(err);
    whenBlastFinished.reject(err);
  });
  shell.on("error", err => {
    logger("error:blast")(err);
    whenBlastFinished.reject(err);
  });

  shell.on("exit", async (code, signal) => {
    if (code === 0) {
      whenBlastFinished.resolve(code);
    } else {
      whenBlastFinished.reject(`Got ${code}:${signal} while running blast`);
    }
  });

  const outputStream = new StreamCollector();
  process.stdin.pipe(shell.stdin);
  shell.stdout.pipe(outputStream);
  return Promise.all([whenBlastFinished, outputStream.output]).then(
    ([, output]) => output // Return the output as long as there wasn't an error running Blast
  );
}

class BlastParser {
  constructor(config) {
    this.config = config;
  }

  reformatHit(queryId, hit) {
    // One hit might have more than one Hight Scoring Pair (HSP)
    const hitAccession = hit.Hit_accession[0];
    const hitId = hit.Hit_def[0];
    const highScoringPairs = _.get(hit, "Hit_hsps[0].Hsp", []);
    return _.map(highScoringPairs, hsp => {
      return {
        hitAccession,
        hitId,
        hitSequence: hsp.Hsp_hseq[0],
        hitStart: Number(hsp["Hsp_hit-from"][0]),
        hitEnd: Number(hsp["Hsp_hit-to"][0]),
        queryId,
        querySequence: hsp.Hsp_qseq[0],
        queryStart: Number(hsp["Hsp_query-from"][0]),
        queryEnd: Number(hsp["Hsp_query-to"][0]),
        matchingBases: Number(hsp.Hsp_identity[0]),
        alignmentLength: Number(hsp["Hsp_align-len"][0]),
        eValue: Number(hsp.Hsp_evalue[0])
      };
    });
  }

  reformatIteration(iteration) {
    // An iteration is a contig in the query sequence
    const queryId = iteration["Iteration_query-def"][0];
    const hits = _.get(iteration, "Iteration_hits[0].Hit", []);
    return _.flatMap(hits, hit => this.reformatHit(queryId, hit));
  }

  _compliment(sequence) {
    const baseMap = {
      "A": "T",
      "C": "G",
      "G": "C",
      "T": "A",
      "a": "t",
      "c": "g",
      "g": "c",
      "t": "a"
    }
    return _(sequence.split(""))
      .map(c => baseMap[c] || c)
      .reverse()
      .join("");
  }

  // Examples of mutations you'd get given different alignments

  //       123456789
  // Ref   TTT--TTTT
  // A     TTT--ATTT    {t: "S", wt: "T",  mut: "A",   rI: 4, qI: 4}
  // B     TTT--AATT    {t: "S", wt: "TT", mut: "AA",  rI: 4, qI: 4}
  // C     TTTA-TTTT    {t: "I", wt: "-",  mut: "A",   rI: 3, qI: 4}
  // D     TTTAATTTT    {t: "I", wt: "--", mut: "AA",  rI: 3, qI: 4}
  // E     TTT---TTT    {t: "D", wt: "T",  mut: "-",   rI: 4, qI: 3}
  // F     TTT----TT    {t: "D", wt: "TT", mut: "--",  rI: 4, qI: 3}

  // Example of mutation you'd get for a given query, reference,
  // and Blast alignment

  //       000000000111111111122222222223
  //       123456789012345678901234567890
  // Query AAAAAAAAAACCTCCCCCCCAAAAAAAAAA
  //                   ^

  //       0000000001
  //       1234567890
  // Ref   GGGGGGGGGG

  // Blast Alignment:
  // Ref / Hit CCCCCCCCCC Start: 10 End: 1
  // Query     CCTCCCCCCC Start: 11 End: 20

  // Mutation  {t: "S", wt: "G", mut: "A", rI: 8, qI: 13}

  addMutations(hit) {
    const { hitSequence, hitStart, hitEnd } = hit;
    const { querySequence, queryStart, queryEnd } = hit;
    let mutations;
    let reversed = false;
    if (hitEnd < hitStart) {
      reversed = true;
      mutations = this._compareAlignment(
        this._compliment(hitSequence),
        this._compliment(querySequence)
      );
    } else {
      mutations = this._compareAlignment(hitSequence, querySequence);
    }
    hit.mutations = mutations;
    _.forEach(mutations, m => {
      const { refOffset, queryOffset } = m;
      m.rI = reversed ? hitEnd + refOffset : hitStart + refOffset;
      m.qI = reversed ? queryEnd - queryOffset : queryStart + queryOffset;
      delete m.refOffset;
      delete m.queryOffset;
    });
    delete hit.hitSequence;
    delete hit.querySequence;
  }

  _compareAlignment(refSequence, querySequence) {
    const newMutation = (type, refBase, refOffset, queryBase, queryOffset) => {
      return {
        t: type,
        wt: refBase, // Wild Type aka reference sequence
        mut: queryBase, // Mutation aka query sequence
        refOffset,
        queryOffset
      }
    }

    // Find just the variant positions
    const variants = [];
    let refOffset = -1;
    let queryOffset = -1;
    _.forEach(refSequence, (refBase, idx) => {
      const queryBase = querySequence[idx];
      if (refBase !== "-") refOffset += 1;
      if (queryBase !== "-") queryOffset += 1;
      if (refBase === queryBase) {
        // Nothing
      } else if (queryBase === "-") {
        variants.push(
          newMutation("D", refBase, refOffset, queryBase, queryOffset)
        );
      } else if (refBase === "-") {
        variants.push(
          newMutation("I", refBase, refOffset, queryBase, queryOffset)
        );
      } else {
        // They're different
        variants.push(
          newMutation("S", refBase, refOffset, queryBase, queryOffset)
        );
      }
    });

    const mergeMutations = (a, b) => {
      const refEnd = a.wt.length + a.refOffset - 1;
      const queryEnd = a.mut.length + a.queryOffset - 1;
      if (
        _.isEqual(
          [a.t, b.t, refEnd + 1, queryEnd + 1],
          ["S", "S", b.refOffset, b.queryOffset]
        )
      ) {
        // Substition
      } else if (
        _.isEqual(
          [a.t, b.t, refEnd + 1, queryEnd],
          ["D", "D", b.refOffset, b.queryOffset]
        )
      ) {
        // Deletion
      } else if (
        _.isEqual(
          [a.t, b.t, refEnd, queryEnd + 1],
          ["I", "I", b.refOffset, b.queryOffset]
        )
      ) {
        // Insertion
      } else {
        return false;
      }
      a.wt = a.wt + b.wt;
      a.mut = a.mut + b.mut;
      return true;
    };

    // Walk the variant positions and join them into mutations
    const mutations = [];
    let currentMutation = newMutation(null);
    _.forEach(variants, nextMutation => {
      if (currentMutation.t === null) {
        currentMutation = nextMutation;
        return;
      }
      const merged = mergeMutations(currentMutation, nextMutation);
      if (!merged) {
        mutations.push(currentMutation);
        currentMutation = nextMutation;
      }
    });
    if (currentMutation.t !== null) mutations.push(currentMutation);
    return mutations;
  }

  async parse(xmlString) {
    const xml = await promisify(parseXml)(xmlString);
    const iterations = _.get(
      xml,
      "BlastOutput.BlastOutput_iterations[0].Iteration",
      []
    );
    return _.flatMap(iterations, iter => this.reformatIteration(iter));
  }
}

async function main() {
  const config = await readConfig(SCHEME);
  const { blastConfiguration } = config;
  const blastOutput = await runBlast(blastConfiguration);
  const blastParser = new BlastParser(config);
  const hits = await blastParser.parse(blastOutput);
  _.forEach(hits, hit => blastParser.addMutations(hit));
  return _.groupBy(hits, "hitId");
}

if (require.main === module) {
  main()
    .then(JSON.stringify)
    .then(console.log)
    .catch(logger("error"));
}

module.exports = { BlastParser };

// Add a r (aka reverse) field to each hit and reorder hitStart to be smaller than hitEnd
// Only consider a partial match of a gene family if there are no alignments against the complete reference
// Total length of core gene family in output "Reference length"
// Percent identity based on matching bases and the alignment length
// If complete hits against different gene families overlap by more than 40 bases then take the one with best pident
// Check for overlaps of any partial match by 40 bases and keep the one with the best pident
// mutations indexed by location in gene family and in the query sequence
// If there are multiple partial matches, keep all of them
// If there are multiple complete matches, keep all of them
// If locations should be relative to the direction the sequences are given in
// Substitutions, deletions etc should be reported in the orientation of the reference
// Only keep "big" partial matches bigger than "minMatchCoverage" percentage