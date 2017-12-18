const path = require("path");
const fs = require("fs");
const logger = require("debug");
const { promisify } = require("util");
const _ = require("lodash");
const Promise = require("bluebird");

const { runBlast, BlastParser } = require("./src/Blast");
const { Core } = require("./src/Core");
const { Fp } = require("./src/Fp");
const { queryName, getBaseCount } = require("./src/Utils");

process.on("unhandledRejection", reason => {
  logger("error:unhandledRejection")(reason);
  process.exit(1);
});

const SCHEME = Number(process.env.WGSA_ORGANISM_TAXID);
const argv = {
  command: process.argv[2]
};
if (argv.command === "query") {
  argv.query = process.argv[3];
} else if (argv.command === "build") {
  argv.references = process.argv.slice(3);
} else {
  logger("error")(`Usage ${process.argv[0]} ${process.argv[1]} query|build`);
  process.exit(1);
}

async function readConfig(scheme) {
  const schemeConfigPath = path.join(__dirname, "schemes", String(scheme), "config.jsn");
  const contents = await promisify(fs.readFile)(schemeConfigPath);
  return JSON.parse(contents);
}

async function buildCore(query) {
  logger("debug")(`Analysing ${query} with ${SCHEME}`);
  const config = await readConfig(SCHEME);
  const { blastConfiguration } = config;
  const blastDb = path.join(__dirname, "databases", String(SCHEME), "core.db");
  const whenQueryLength = getBaseCount(fs.createReadStream(query));
  const blastInputStream = fs.createReadStream(query);
  const blastOutput = await runBlast(blastDb, blastConfiguration, blastInputStream);
  // await promisify(fs.writeFile)(`./${SCHEME}.xml`, blastOutput);
  // const blastOutput = await promisify(fs.readFile)(`./${SCHEME}.xml`);
  const blastParser = new BlastParser(config);
  const hits = await blastParser.parse(blastOutput);
  const queryLength = await whenQueryLength;
  const coreAnalyser = new Core(config);
  const assemblyId = queryName(query);
  const speciesId = SCHEME;
  const summaryData = {
    assemblyId,
    speciesId,
    queryLength
  };
  return coreAnalyser.getCore(hits, summaryData);
}

async function buildFpProfile(references) {
  logger("debug")(`Building FP for ${SCHEME} from ${references.length} references`);
  const fp = new Fp();
  const whenCoresAdded = Promise.map(
    references,
    async reference => {
      const core = await buildCore(reference);
      const { assemblyId } = core.coreSummary;
      const { coreProfile } = core.coreProfile;
      fp.addReference(assemblyId, coreProfile);
    },
    { concurrency: 3 }
  );
  await whenCoresAdded;
  return fp.getProfile();
}

if (require.main === module) {
  if (argv.command === "query") {
    const { query } = argv;
    buildCore(query)
      .then(JSON.stringify)
      .then(console.log)
      .catch(logger("error"));
  } else if (argv.command === "build") {
    const { references } = argv;
    buildFpProfile(references)
      .then(JSON.stringify)
      .then(console.log)
      .catch(logger("error"));
  }
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
