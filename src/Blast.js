const { spawn } = require("child_process");
const logger = require("debug");
const { promisify } = require("util");
const { parseString: parseXml } = require("xml2js");
const _ = require("lodash");

const { defer, StreamCollector } = require("./Utils");

async function runBlast(blastDb, blastConfiguration, blastInputStream) {
  logger("debug")(`Running blast with ${blastDb}`);
  const blastCommand = [
    "blastn -task blastn -outfmt 5 -query -",
    "-db", blastDb,
    "-perc_identity", blastConfiguration.gatheringPid,
    "-evalue", blastConfiguration.gatheringEValue,
    "-num_alignments", blastConfiguration.maxMatches
  ];
  blastCommand.push(...(blastConfiguration.otherOptions || []));
  const whenBlastFinished = defer();
  logger("trace")(`Blast command is '${blastCommand.join(" ")}'`);
  const shell = spawn(blastCommand.join(" "), { shell: true });

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
  blastInputStream.pipe(shell.stdin);
  shell.stdout.pipe(outputStream);
  return Promise.all([whenBlastFinished, outputStream.output]).then(
    ([, output]) => output // Return the output as long as there wasn't an error running Blast
  );
}

class BlastParser {
  constructor(config) {
    this.config = config;
  }

  _pIdent(hit) {
    // Percentage identity of the hit
    const { matchingBases, alignmentLength } = hit;
    return 100 * (matchingBases / alignmentLength);
  }

  reformatHit(queryId, hit) {
    // One hit might have more than one Hight Scoring Pair (HSP)
    const hitAccession = hit.Hit_accession[0];
    const hitId = hit.Hit_def[0];
    const highScoringPairs = _.get(hit, "Hit_hsps[0].Hsp", []);
    const hits = _.map(highScoringPairs, hsp => {
      const start = Number(hsp["Hsp_hit-from"][0]);
      const end = Number(hsp["Hsp_hit-to"][0]);
      const reverse = start > end;
      return {
        hitAccession,
        hitId,
        hitSequence: hsp.Hsp_hseq[0],
        hitStart: reverse ? end : start,
        hitEnd: reverse ? start : end,
        reverse,
        queryId,
        querySequence: hsp.Hsp_qseq[0],
        queryStart: Number(hsp["Hsp_query-from"][0]),
        queryEnd: Number(hsp["Hsp_query-to"][0]),
        matchingBases: Number(hsp.Hsp_identity[0]),
        alignmentLength: Number(hsp["Hsp_align-len"][0]),
        eValue: Number(hsp.Hsp_evalue[0])
      };
    });
    return _.map(hits, hit => {
      hit.pIdent = this._pIdent(hit);
      return hit
    });
  }

  reformatIteration(iteration) {
    // An iteration is a contig in the query sequence
    const queryId = iteration["Iteration_query-def"][0];
    const hits = _.get(iteration, "Iteration_hits[0].Hit", []);
    return _.flatMap(hits, hit => this.reformatHit(queryId, hit));
  }

  async parse(xmlString) {
    logger("debug")("Parsing the blast output xml");
    const xml = await promisify(parseXml)(xmlString);
    const iterations = _.get(
      xml,
      "BlastOutput.BlastOutput_iterations[0].Iteration",
      []
    );
    return _.flatMap(iterations, iter => this.reformatIteration(iter));
  }
}

module.exports = { runBlast, BlastParser };
