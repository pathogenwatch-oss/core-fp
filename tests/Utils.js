const _ = require("lodash");
const { test } = require("ava");
const { PassThrough } = require("stream");

const { getBaseCount, queryName } = require("../src/Utils");

test("Count bases in a fasta", async t => {
  const stream = new PassThrough();
  const whenCounted = getBaseCount(stream);
  stream.write(">Foo\n");
  stream.write("ACGT\n");
  stream.write(">Bar\n");
  stream.write("acgt\n");
  stream.write(">Baz\n");
  stream.write("acgtacgt\n");
  stream.end("");
  const counted = await whenCounted;
  t.is(counted, 16);
});

test("Get query name", t => {
  const testCases = [
    ["bar.fasta", "bar"],
    ["./foo/bar.fasta", "bar"],
    ["/foo/bar.fasta", "bar"],
    ["/foo/bar.fa", "bar"],
    ["/foo/bar.mfa", "bar"],
    ["/foo/bar.tfa", "bar"],
    ["/foo/barfa", "barfa"],
    ["/foo/fabulous.fasta", "fabulous"],
    ["/foo/bar.fasta.fa.mfa.tfa", "bar.fasta.fa.mfa"]
  ];
  _.forEach(testCases, ([filePath, expected]) => {
    const actual = queryName(filePath);
    t.is(actual, expected);
  });
});
