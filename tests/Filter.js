const _ = require("lodash");
const { test } = require("ava");
const sinon = require("sinon");

const { Filter } = require("../src/Filter");

test("Compare alleles", t => {
  // TODO: I assumed that bounds don't matter.
  const filter = new Filter();

  const testCases = {
    identical: {
      first: [{ t: "S", mut: "A", rI: 4 }],
      second: [{ t: "S", mut: "A", rI: 4 }],
      expected: 0
    },
    notInFirst: {
      first: [],
      second: [{ t: "S", mut: "A", rI: 4 }],
      expected: 1
    },
    notASubstitution: {
      first: [{ t: "S", mut: "A", rI: 4 }],
      second: [{ t: "I", mut: "A", rI: 4 }],
      expected: 1
    },
    many: {
      first: [
        { t: "S", mut: "A", rI: 16 },
        { t: "S", mut: "A", rI: 4 },
        { t: "I", mut: "A", rI: 12 },
        { t: "S", mut: "A", rI: 8 }
      ],
      second: [
        { t: "S", mut: "A", rI: 8 },
        { t: "S", mut: "A", rI: 5 },
        { t: "S", mut: "T", rI: 16 },
        { t: "S", mut: "A", rI: 12 }
      ],
      expected: 4
    },
    deletion: {
      first: [{ t: "S", mut: "A", rI: 4 }, { t: "D", mut: "-", rI: 4 }],
      second: [{ t: "D", mut: "-", rI: 4 }, { t: "S", mut: "A", rI: 4 }],
      expected: 0
    },
    anotherDeletion: {
      first: [{ t: "D", mut: "-", rI: 4 }],
      second: [{ t: "D", mut: "-", rI: 4 }, { t: "S", mut: "A", rI: 4 }],
      expected: 1
    }
  };

  _.forEach(testCases, ({ first, second, expected }, testName) => {
    t.is(filter._compareMutations(first, second), expected, testName);
    t.is(
      filter._compareMutations(second, first),
      expected,
      `${testName} reversed`
    );
  });
});

function shuffleAlleles(alleles) {
  return _.map(_.shuffle(alleles), allele => {
    const { muts } = allele;
    const newAllele = _.cloneDeep(allele);
    newAllele.muts = _.shuffle(muts);
    return newAllele;
  });
}

function summariseAlleles(alleles) {
  return _.map(alleles, ({ muts }) => _.map(muts, ({ rI }) => rI).join(","));
}

test("Compare alleles unambiguously", t => {
  const filter = new Filter();

  const referenceAlleles = [
    { muts: [{ t: "S", mut: "A", rI: 1 }] }, // A
    { muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }] }, // B
    { muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }] } // C
  ];

  const queryAlleles = [
    { muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "T", rI: 100 }] }, // v
    { muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }] }, // w
  ];

  // You could map the distances between these alleles as follows:
  // Query are letters, references are numbers

  //  Av
  //  B w
  //  C

  t.deepEqual(filter._compareAlleles(referenceAlleles, queryAlleles), { allelesCompared: 2, differences: 3 }, "Unshuffled");
  t.deepEqual(filter._compareAlleles(queryAlleles, referenceAlleles), { allelesCompared: 2, differences: 3 }, "Reversed");

  _.forEach(_.range(1000), () => {
    // It shouldn't matter which order the alleles or mutations are presented in
    const shuffledReferences = shuffleAlleles(referenceAlleles);
    const shuffledQueries = shuffleAlleles(queryAlleles);
    const shuffleSummary = JSON.stringify({ref: summariseAlleles(shuffledReferences), query: summariseAlleles(shuffledQueries)});
    t.deepEqual(filter._compareAlleles(shuffledReferences, shuffledQueries), { allelesCompared: 2, differences: 3 }, shuffleSummary);
    t.deepEqual(filter._compareAlleles(shuffledQueries, shuffledReferences), { allelesCompared: 2, differences: 3 }, `rev: ${shuffleSummary}`);
  });
});

test("Compare alleles ambiguously", t => {
  const filter = new Filter();

  // The greedy algorithm we're using doesn't always find the lowest possible
  // score when matching pairs of alleles.  This is an example

  const referenceAlleles = [
    { muts: [{ t: "S", mut: "A", rI: 1 }] }, // A
    { muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }, { t: "S", mut: "A", rI: 7 }] }, // B
    { muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }, { t: "S", mut: "A", rI: 7 }, { t: "S", mut: "T", rI: 98 }] } // C
  ];

  const queryAlleles = [
    { muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }] }, // v
    { muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }] }, // w
  ];

  // You could map the distances between these alleles as follows:
  // Query are letters, references are numbers

  //  A  w
  //  v
  //
  // CB

  // The greedy algorithm scores (A -> v = 1) + (B -> w = 5) = 6
  // A better algorithm scores (A -> w = 2) + (B -> v = 2) = 4
  // For simplicity and historic reasons we pick the greedy algorithm which will
  // Give the same result in most circumstances.

  t.deepEqual(filter._compareAlleles(referenceAlleles, queryAlleles), { allelesCompared: 2, differences: 6 }, "Unshuffled");
  t.deepEqual(filter._compareAlleles(queryAlleles, referenceAlleles), { allelesCompared: 2, differences: 6 }, "Reversed");

  _.forEach(_.range(1000), () => {
    // It shouldn't matter which order the alleles or mutations are presented in
    const shuffledReferences = shuffleAlleles(referenceAlleles);
    const shuffledQueries = shuffleAlleles(queryAlleles);
    const shuffleSummary = JSON.stringify({ref: summariseAlleles(shuffledReferences), query: summariseAlleles(shuffledQueries)});
    t.deepEqual(filter._compareAlleles(shuffledReferences, shuffledQueries), { allelesCompared: 2, differences: 6 }, shuffleSummary);
    t.deepEqual(filter._compareAlleles(shuffledQueries, shuffledReferences), { allelesCompared: 2, differences: 6 }, `rev: ${shuffleSummary}`);
  });
});
