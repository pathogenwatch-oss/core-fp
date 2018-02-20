const path = require("path");
const fs = require("fs");
const logger = require("debug");
const { promisify } = require("util");
const _ = require("lodash");
const Promise = require("bluebird");
const mkdirp = require("mkdirp-promise");

const { runBlast, BlastParser } = require("./src/Blast");
const { Core } = require("./src/Core");
const { Fp } = require("./src/Fp");
const { Filter } = require("./src/Filter");
const { queryName, getBaseCount } = require("./src/Utils");

process.on("unhandledRejection", reason => {
  logger("error:unhandledRejection")(reason);
  process.exit(1);
});

const SCHEME = Number(process.env.WGSA_ORGANISM_TAXID);
const CORE_DB_ROOT =
  process.env.CORE_DB_ROOT || path.join(__dirname, "databases");
const SCHEME_PROFILE_PATH = path.join(CORE_DB_ROOT, String(SCHEME), "fp.json");
const SCHEME_BLAST_DB = path.join(CORE_DB_ROOT, String(SCHEME), "core.db");

const argv = {
  command: process.argv[2]
};
if (argv.command === "query" || argv.command === "debug") {
  argv.queryPath = process.argv[3];
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

async function readFpProfile() {
  const contents = await promisify(fs.readFile)(SCHEME_PROFILE_PATH);
  return JSON.parse(contents);
}

function referenceCorePath(scheme, name) {
  return path.join(
    __dirname,
    "databases",
    String(scheme),
    "references",
    `${name}.json`
  );
}

async function writeReferenceCore(scheme, name, core) {
  const filePath = referenceCorePath(scheme, name);
  const dirPath = path.dirname(filePath);
  await mkdirp(dirPath, { mode: 0o755 });
  await promisify(fs.writeFile)(filePath, JSON.stringify(core));
  logger("debug")(`Wrote core for ${name} to ${filePath}`);
  return filePath;
}

async function readReferenceCore(scheme, name) {
  const filePath = referenceCorePath(scheme, name);
  const contents = await promisify(fs.readFile)(filePath);
  return JSON.parse(contents);
}

const [SKIP_FP, RUN_FP] = [true, false];
async function query(queryPath, skipFp) {
  logger("debug")(`Analysing ${queryPath} with ${SCHEME}`);
  const whenReferenceDetails = skipFp ? Promise.resolve(null) : readFpProfile();
  const config = await readConfig(SCHEME);
  const { blastConfiguration } = config;
  const blastDb = SCHEME_BLAST_DB;
  const whenQueryLength = getBaseCount(fs.createReadStream(queryPath));
  const blastInputStream = fs.createReadStream(queryPath);
  const blastOutput = await runBlast(
    blastDb,
    blastConfiguration,
    blastInputStream
  );
  // await promisify(fs.writeFile)(`./${SCHEME}.xml`, blastOutput);
  // const blastOutput = await promisify(fs.readFile)(`./${SCHEME}.xml`);
  const blastParser = new BlastParser(config);
  const hits = await blastParser.parse(blastOutput);
  const queryLength = await whenQueryLength;
  const coreAnalyser = new Core(config);
  const assemblyId = queryName(queryPath);
  const speciesId = String(SCHEME);
  const summaryData = {
    assemblyId,
    speciesId,
    queryLength
  };
  const core = coreAnalyser.getCore(hits, summaryData);
  const referenceDetails = await whenReferenceDetails;
  if (!skipFp) {
    logger("debug")("Adding FP to Core");
    const referenceFp = Fp.load(referenceDetails);
    const { coreProfile: queryCoreProfile } = core.coreProfile;
    core.fp = referenceFp.calculateFp(queryCoreProfile, summaryData);

    logger("debug")("Adding Filter to Core");
    const { subTypeAssignment: referenceId } = core.fp;
    const genes = referenceFp.genes();
    const numberGeneFamilies = genes.length;
    const filter = new Filter();
    const referenceCore = await readReferenceCore(SCHEME, referenceId);
    const { coreProfile: referenceCoreProfile } = referenceCore.coreProfile;
    const bothCoreProfiles = {
      queryCoreProfile,
      referenceCoreProfile
    };
    core.filter = filter.calculateFilter(
      referenceId,
      summaryData,
      numberGeneFamilies,
      bothCoreProfiles
    );
  }
  return core;
}

async function build(references) {
  logger("debug")(
    `Building FP for ${SCHEME} from ${references.length} references`
  );
  const fp = new Fp();
  const whenCoresAdded = Promise.map(
    references,
    async reference => {
      const core = await query(reference, SKIP_FP);
      const { assemblyId } = core.coreSummary;
      const { coreProfile } = core.coreProfile;
      await writeReferenceCore(SCHEME, assemblyId, core);
      fp.addCore(assemblyId, coreProfile);
      return assemblyId;
    },
    { concurrency: 3 }
  );
  await whenCoresAdded;
  fp.removeNonUniversalGenes();
  return fp.dump();
}

async function debug(queryPath) {
  logger("debug")(`Debugging ${queryPath} core with ${SCHEME}`);
  const config = await readConfig(SCHEME);
  const { blastConfiguration } = config;
  const blastDb = SCHEME_BLAST_DB;
  const blastInputStream = fs.createReadStream(queryPath);
  const blastOutput = await runBlast(
    blastDb,
    blastConfiguration,
    blastInputStream
  );
  const blastParser = new BlastParser(config);
  const hits = await blastParser.parse(blastOutput);
  const coreAnalyser = new Core(config);
  _.forEach(hits, hit => {
    coreAnalyser.addQueryHash(hit);
    coreAnalyser.addMutations(hit);
    coreAnalyser.addDebugStats(hit);
  });
  coreAnalyser.tagShortHits(hits);
  return { scheme: SCHEME, hits };
}

if (require.main === module) {
  if (argv.command === "query") {
    const { queryPath } = argv;
    query(queryPath, RUN_FP)
      .then(JSON.stringify)
      .then(console.log)
      .then(() => logger("debug")("Finished"))
      .catch(logger("error"));
  } else if (argv.command === "debug") {
    const { queryPath } = argv;
    debug(queryPath)
      .then(JSON.stringify)
      .then(console.log)
      .then(() => logger("debug")("Finished"))
      .catch(logger("error"));
  } else if (argv.command === "build") {
    const { references } = argv;
    build(references)
      .then(JSON.stringify)
      .then(async data => {
        await promisify(fs.writeFile)(SCHEME_PROFILE_PATH, data);
        return `Wrote FP profile for ${SCHEME} to ${SCHEME_PROFILE_PATH}`;
      })
      .then(console.log)
      .then(() => logger("debug")("Finished"))
      .catch(logger("error"));
  }
}

// TODO: counted sites in fp should vary between references because not all references fully match the core
