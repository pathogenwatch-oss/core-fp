const { Writable } = require("stream");

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

module.exports = { defer, StreamCollector };
