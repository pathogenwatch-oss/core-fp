const { test } = require("ava");

const { BlastParser } = require("../src/Blast");

test("Percentage identity", t => {
  const blastParser = new BlastParser();
  t.is(
    blastParser._pIdent({
      matchingBases: 10,
      alignmentLength: 100
    }),
    10,
    "10/100"
  );
  t.is(
    blastParser._pIdent({
      matchingBases: 98,
      alignmentLength: 99
    }),
    98.99,
    "98/99"
  );
  t.is(
    blastParser._pIdent({
      matchingBases: 94,
      alignmentLength: 99
    }),
    94.95,
    "94/99"
  );
});