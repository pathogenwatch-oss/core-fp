const _ = require("lodash");
const { test } = require("ava");
const sinon = require("sinon");

const { Filter } = require("../src/Filter");

test("Compare alleles", t => {
  const filter = new Filter();

  const testCases = {
    identical: {
      first: [{ t: "S", mut: "A", rI: 4 }],
      second: [{ t: "S", mut: "A", rI: 4 }],
      overlap: [1, 10],
      expected: 0
    },
    notInFirst: {
      first: [],
      second: [{ t: "S", mut: "A", rI: 4 }],
      overlap: [1, 10],
      expected: 1
    },
    notASubstitution: {
      first: [{ t: "S", mut: "A", rI: 4 }],
      second: [{ t: "I", mut: "A", rI: 4 }],
      overlap: [1, 10],
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
      overlap: [1, 20],
      expected: 4
    },
    deletion: {
      first: [{ t: "S", mut: "A", rI: 4 }, { t: "D", mut: "-", rI: 4 }],
      second: [{ t: "D", mut: "-", rI: 4 }, { t: "S", mut: "A", rI: 4 }],
      overlap: [1, 10],
      expected: 0
    },
    anotherDeletion: {
      first: [{ t: "D", mut: "-", rI: 4 }],
      second: [{ t: "D", mut: "-", rI: 4 }, { t: "S", mut: "A", rI: 4 }],
      overlap: [1, 10],
      expected: 1
    },
    partialHits: {
      first: [
        { t: "S", mut: "A", rI: 16 }, // Out of bounds
        { t: "S", mut: "A", rI: 4 }, // Out of bounds
        { t: "I", mut: "A", rI: 12 }, // Insertion
        { t: "S", mut: "A", rI: 8 } // Same
      ],
      second: [
        { t: "S", mut: "A", rI: 8 }, // Same
        { t: "S", mut: "A", rI: 5 }, // VARIANT
        { t: "S", mut: "T", rI: 16 }, // Out of bounds
        { t: "S", mut: "A", rI: 12 } // VARIANT
      ],
      overlap: [5, 15],
      expected: 2
    }
  };

  _.forEach(testCases, ({ first, second, overlap, expected }, testName) => {
    t.is(filter._compareMutations(first, second, overlap), expected, testName);
    t.is(
      filter._compareMutations(second, first, overlap),
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
  return _.map(alleles, ({ id, muts }) => id + ":" + _.map(muts, ({ rI }) => rI).join(","));
}

test("Compare alleles unambiguously", t => {
  const filter = new Filter();

  const referenceAlleles = [
    { id: "A", muts: [{ t: "S", mut: "A", rI: 1 }], rR: [1, 120] },
    { id: "B", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }], rR: [1, 150] },
    { id: "C", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }], rR: [1, 150] }
  ];

  const queryAlleles = [
    { id: "v", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "T", rI: 100 }], rR: [1, 110] },
    { id: "w", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }], rR: [1, 200] }
  ];

  // You could map the distances between these alleles as follows:
  // Query are uppercase, references are lower case.

  //  Av
  //  B w
  //  C

  _.forEach(_.range(1000), () => {
    // It shouldn't matter which order the alleles or mutations are presented in
    const shuffledReferences = shuffleAlleles(referenceAlleles);
    const shuffledQueries = shuffleAlleles(queryAlleles);
    const shuffleSummary = JSON.stringify({
      ref: summariseAlleles(shuffledReferences),
      query: summariseAlleles(shuffledQueries)
    });
    const bestMatches = filter._compareAlleles(
      shuffledQueries,
      shuffledReferences
    );
    t.deepEqual(
      bestMatches,
      {
        v: {
          length: 110,
          variance: 1,
          bestRefAllele: "A"
        },
        w: {
          length: 150,
          variance: 2,
          bestRefAllele: "B"
        }
      },
      shuffleSummary
    );
  });
});

test("Compare alleles ambiguously", t => {
  const filter = new Filter();

  // The greedy algorithm we're using doesn't always find the lowest possible
  // score when matching pairs of alleles.  This is an example

  const referenceAlleles = [
    { id: "A", muts: [{ t: "S", mut: "A", rI: 1 }], rR: [1, 120] },
    { id: "B", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }, { t: "S", mut: "A", rI: 7 }], rR: [1, 150] },
    { id: "C", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }, { t: "S", mut: "A", rI: 7 }, { t: "S", mut: "T", rI: 98 }], rR: [1, 150] }
  ];

  const queryAlleles = [
    { id: "v", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }], rR: [1, 110]  },
    { id: "w", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }], rR: [1, 200] }
  ];

  // You could map the distances between these alleles as follows:
  // Query are uppercase, references are lower case.

  //  A  w
  //  v
  //
  // CB

  // The greedy algorithm scores (A -> v = 1) + (B -> w = 5) = 6
  // A better algorithm scores (A -> w = 2) + (B -> v = 2) = 4
  // For simplicity and historic reasons we pick the greedy algorithm which will
  // Give the same result in most circumstances.

  _.forEach(_.range(1000), () => {
    // It shouldn't matter which order the alleles or mutations are presented in
    const shuffledReferences = shuffleAlleles(referenceAlleles);
    const shuffledQueries = shuffleAlleles(queryAlleles);
    const shuffleSummary = JSON.stringify({
      ref: summariseAlleles(shuffledReferences),
      query: summariseAlleles(shuffledQueries)
    });
    const bestMatches = filter._compareAlleles(
      shuffledQueries,
      shuffledReferences
    );
    t.deepEqual(
      bestMatches,
      {
        v: {
          length: 110,
          variance: 1,
          bestRefAllele: "A"
        },
        w: {
          length: 150,
          variance: 5,
          bestRefAllele: "B"
        }
      },
      shuffleSummary
    );
  });
});

test("Compare query to reference", t => {
  const queryCoreProfile = {
    commonGene: {
      alleles: [
        {
          id: "commonGeneQuery",
          muts: [{ t: "S", mut: "A", rI: 100 }],
          rR: [51, 150]
        }
      ]
    },
    commonWithDuplicates: {
      alleles: [
        {
          id: "commonWithDuplicatesQuery1",
          muts: [{ t: "S", mut: "A", rI: 11 }],
          rR: [1, 200]
        },
        {
          id: "commonWithDuplicatesQuery2",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "A", rI: 13 }, { t: "S", mut: "A", rI: 15 }],
          rR: [10, 190]
        },
        {
          id: "commonWithDuplicatesQuery3",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "A", rI: 13 }, { t: "S", mut: "A", rI: 15 }, { t: "S", mut: "A", rI: 17 }],
          rR: [5, 150]
        }
      ]
    },
    onlyInQuery: {
      alleles: [
        {
          id: "onlyInQuery",
          muts: [{ t: "S", mut: "A", rI: 1 }],
          rR: [1, 300]
        }
      ]
    }
  };

  const referenceCoreProfile = {
    onlyInReference: {
      alleles: [
        {
          id: "onlyInReference",
          muts: [{ t: "S", mut: "A", rI: 1 }],
          rR: [1, 500]
        }
      ]
    },
    commonGene: {
      alleles: [
        {
          id: "commonGeneReference",
          muts: [{ t: "S", mut: "A", rI: 103 }],
          rR: [11, 110]
        }
      ]
    },
    commonWithDuplicates: {
      alleles: [
        {
          id: "commonWithDuplicatesReference1",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "T", rI: 100 }],
          rR: [5, 160]
        },
        {
          id: "commonWithDuplicatesReference2",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "A", rI: 13 }, { t: "S", mut: "A", rI: 15 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }],
          rR: [8, 180]
        }
      ]
    }
  };

  const filter = new Filter();
  const { mutationRate, alleleDifferences } = filter._compare(
    queryCoreProfile,
    referenceCoreProfile
  );
  t.is(mutationRate, 5 / 387);
  t.deepEqual(alleleDifferences, {
    commonGene: {
      commonGeneQuery: {
        length: 60,
        variance: 2,
        bestRefAllele: "commonGeneReference"
      }
    },
    commonWithDuplicates: {
      // If the query alleles are A,B,C and the reference alleles are v and w
      // their distances could be plotted as follows:

      //  Av.
      //  ...
      //  B.w
      //  C..
      commonWithDuplicatesQuery1: {
        length: 156,
        variance: 1,
        bestRefAllele: "commonWithDuplicatesReference1"
      },
      commonWithDuplicatesQuery2: {
        length: 171,
        variance: 2,
        bestRefAllele: "commonWithDuplicatesReference2"
      }
    }
  });
});

test("Calculate filtered alleles", t => {
  const queryCoreProfile = {
    commonGene: { alleles: [{ id: "commonGeneQuery" }] },
    commonWithDuplicates: {
      alleles: [
        { id: "commonWithDuplicatesQuery1" },
        { id: "commonWithDuplicatesQuery2" },
        { id: "commonWithDuplicatesQuery3" }
      ]
    },
    onlyInQuery: { alleles: [{ id: "onlyInQuery" }] }
  };
  const referenceCoreProfile = {
    onlyInReference: { alleles: [{ id: "onlyInReference" }] },
    commonGene: { alleles: [{ id: "commonGeneReference" }] },
    commonWithDuplicates: {
      alleles: [
        { id: "commonWithDuplicatesReference1" },
        { id: "commonWithDuplicatesReference2" }
      ]
    }
  };

  const filter = new Filter();
  const fakeAlleleDifferences = {
    commonGene: {
      commonGeneQuery: {
        length: 70,
        variance: 3,
        bestRefAllele: "commonGeneReference"
      }
    },
    commonWithDuplicates: {
      commonWithDuplicatesQuery1: {
        length: 1000,
        variance: 1,
        bestRefAllele: "commonWithDuplicatesReference1"
      },
      commonWithDuplicatesQuery2: {
        length: 1000,
        variance: 5,
        bestRefAllele: "commonWithDuplicatesReference2"
      },
      commonWithDuplicatesQuery3: {
        length: 800,
        variance: 15,
        bestRefAllele: "commonWithDuplicatesReference2"
      }
    }
  };
  const fakeMutationRate = 0.01;
  filter._compare = sinon.stub().returns({
    mutationRate: fakeMutationRate,
    alleleDifferences: fakeAlleleDifferences
  });

  const actual = filter._filter(queryCoreProfile, referenceCoreProfile, 0.01);
  const { filteredAlleles, mutationRate } = actual;
  const expected = [
    {
      familyId: "commonWithDuplicates",
      alleleId: "commonWithDuplicatesQuery1",
      variance: 1
    },
    {
      familyId: "commonWithDuplicates",
      alleleId: "commonWithDuplicatesQuery3",
      variance: 15
    }
  ];

  t.deepEqual(filteredAlleles, expected);
  t.true(
    filter._compare.withArgs(queryCoreProfile, referenceCoreProfile).calledOnce
  );
  t.is(mutationRate, 0.01);
});

test("Overlap", t => {
  const filter = new Filter();
  const queryAllele = { rR: [50, 100] };
  const testCases = [
    {
      allele: { rR: [50, 100] },
      expected: [50, 100]
    },
    {
      allele: { rR: [100, 50] },
      expected: [50, 100]
    },
    {
      allele: { rR: [1, 50] },
      expected: [50, 50]
    },
    {
      allele: { rR: [1, 100] },
      expected: [50, 100]
    },
    {
      allele: { rR: [1, 75] },
      expected: [50, 75]
    },
    {
      allele: { rR: [75, 100] },
      expected: [75, 100]
    },
    {
      allele: { rR: [75, 150] },
      expected: [75, 100]
    },
    {
      allele: { rR: [150, 75] },
      expected: [75, 100]
    },
    {
      allele: { rR: [100, 150] },
      expected: [100, 100]
    },
    {
      allele: { rR: [101, 150] },
      expected: null
    },
    {
      allele: { rR: [75, 80] },
      expected: [75, 80]
    },
    {
      allele: { rR: [1, 150] },
      expected: [50, 100]
    }
  ];
  _.forEach(testCases, ({ allele, expected }) => {
    t.deepEqual(
      filter._overlap(queryAllele, allele),
      expected,
      JSON.stringify(allele)
    );
    t.deepEqual(
      filter._overlap(allele, queryAllele),
      expected,
      `Backward: ${JSON.stringify(allele)}`
    );
  });
});
