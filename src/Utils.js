const { Writable } = require("stream");
const fasta = require("bionode-fasta");
const path = require("path");
const logger = require("debug");

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

function getBaseCount(stream) {
  logger("debug")("Counting the number of nucleotides in the query sequence");
  const output = defer();
  const sequences = fasta.obj();
  let totalLength = 0;
  sequences.on("data", ({ seq }) => (totalLength += seq.length));
  sequences.on("end", () => output.resolve(totalLength));
  sequences.on("error", err => output.reject(err));
  stream.pipe(sequences);
  return output;
}

function queryName(filePath) {
  const fileName = path.basename(filePath);
  return fileName.replace(/(\.fasta|\.fa|\.mfa|\.tfa)$/, "");
}

module.exports = { defer, StreamCollector, getBaseCount, queryName };
