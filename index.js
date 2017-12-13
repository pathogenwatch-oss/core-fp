const path = require("path");
const fs = require("fs");
const logger = require("debug");
const { promisify } = require("util");
const _ = require("lodash");

const { runBlast, BlastParser } = require("./src/Blast");

process.on("unhandledRejection", reason => {
  logger("error:unhandledRejection")(reason);
  process.exit(1);
});

const SCHEME = Number(process.env.WGSA_ORGANISM_TAXID);

async function readConfig(scheme) {
  const schemeConfigPath = path.join(__dirname, "schemes", String(scheme), "config.jsn");
  const contents = await promisify(fs.readFile)(schemeConfigPath);
  return JSON.parse(contents);
}

async function main() {
  const config = await readConfig(SCHEME);
  const { blastConfiguration } = config;
  const blastDb = path.join(__dirname, "databases", String(SCHEME), "core.db");
  const blastOutput = await runBlast(blastDb, blastConfiguration);
  // await promisify(fs.writeFile)(`./${SCHEME}.xml`, blastOutput);
  // const blastOutput = await promisify(fs.readFile)(`./${SCHEME}.xml`);
  const blastParser = new BlastParser(config);
  const hits = await blastParser.parse(blastOutput);
  blastParser._removePartialHits(hits);
  blastParser._removeShortHits(hits);
  blastParser._removeOverlappingHits(hits);
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
// [DONE] Only consider a partial match of a gene family if there are no alignments against the complete reference
// Total length of core gene family in output "Reference length"
// [DONE] Percent identity based on matching bases and the alignment length
// [DONE] If complete hits against different gene families overlap by more than 40 bases then take the one with best pident
// [DONE] Check for overlaps of any partial match by 40 bases and keep the one with the best pident
// [DONE] Only keep "big" partial matches bigger than "minMatchCoverage" percentage
// [DONE] Use the additional blast options
