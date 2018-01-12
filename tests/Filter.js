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
  return _.map(alleles, ({ id, muts }) => id + ":" + _.map(muts, ({ rI }) => rI).join(","));
}

test("Compare alleles unambiguously", t => {
  const filter = new Filter();

  const referenceAlleles = [
    { id: "A", muts: [{ t: "S", mut: "A", rI: 1 }] },
    { id: "B", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }] },
    { id: "C", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }] }
  ];

  const queryAlleles = [
    { id: "v", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "T", rI: 100 }], qR: [1, 200] },
    { id: "w", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }], qR: [250, 1] }
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
    const {
      allelesCompared,
      differences,
      bestMatches
    } = filter._compareAlleles(shuffledQueries, shuffledReferences);
    t.is(allelesCompared, 2, shuffleSummary);
    t.is(differences, 3, shuffleSummary);
    t.deepEqual(
      bestMatches,
      {
        v: {
          length: 200,
          variance: 1,
          bestRefAllele: "A"
        },
        w: {
          length: 250,
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
    { id: "A", muts: [{ t: "S", mut: "A", rI: 1 }] },
    { id: "B", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }, { t: "S", mut: "A", rI: 7 }] },
    { id: "C", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }, { t: "S", mut: "A", rI: 7 }, { t: "S", mut: "T", rI: 98 }] }
  ];

  const queryAlleles = [
    { id: "v", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }], qR: [1, 200]  },
    { id: "w", muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }], qR: [250, 1] }
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

  _.forEach(_.range(1), () => {
    // It shouldn't matter which order the alleles or mutations are presented in
    const shuffledReferences = shuffleAlleles(referenceAlleles);
    const shuffledQueries = shuffleAlleles(queryAlleles);
    const shuffleSummary = JSON.stringify({
      ref: summariseAlleles(shuffledReferences),
      query: summariseAlleles(shuffledQueries)
    });
    const {
      allelesCompared,
      differences,
      bestMatches
    } = filter._compareAlleles(shuffledQueries, shuffledReferences);
    t.is(allelesCompared, 2, shuffleSummary);
    t.is(differences, 6, shuffleSummary);
    t.deepEqual(
      bestMatches,
      {
        v: {
          length: 200,
          variance: 1,
          bestRefAllele: "A"
        },
        w: {
          length: 250,
          variance: 2,
          bestRefAllele: "A"
        }
      },
      shuffleSummary
    );
  });
});

test("Compare query to reference", t => {
  // TODO: I'm assuming we should ignore missing genes (in the reference or query) when calculating the mutation rate

  const queryCoreProfile = {
    commonGene: {
      alleles: [
        {
          id: "commonGeneQuery",
          muts: [{ t: "S", mut: "A", rI: 1 }],
          qR: [1, 70]
        }
      ],
      refLength: 100
    },
    commonWithDuplicates: {
      alleles: [
        {
          id: "commonWithDuplicatesQuery1",
          muts: [{ t: "S", mut: "A", rI: 1 }],
          qR: [901, 1100]
        },
        {
          id: "commonWithDuplicatesQuery2",
          muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }],
          qR: [301, 500]
        },
        {
          id: "commonWithDuplicatesQuery3",
          muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }, { t: "S", mut: "A", rI: 7 }],
          qR: [701, 850]
        }
      ],
      refLength: 200
    },
    onlyInQuery: {
      alleles: [
        {
          id: "onlyInQuery",
          muts: [{ t: "S", mut: "A", rI: 1 }],
          qR: [1201, 1450]
        }
      ]
    },
    refLength: 300
  };

  const referenceCoreProfile = {
    onlyInReference: {
      alleles: [
        {
          id: "onlyInReference",
          muts: [{ t: "S", mut: "A", rI: 1 }]
        }
      ],
      refLength: 500
    },
    commonGene: {
      alleles: [
        {
          id: "commonGeneReference",
          muts: [{ t: "S", mut: "A", rI: 3 }]
        }
      ],
      refLength: 100
    },
    commonWithDuplicates: {
      alleles: [
        {
          id: "commonWithDuplicatesReference1",
          muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "T", rI: 100 }]
        },
        {
          id: "commonWithDuplicatesReference2",
          muts: [{ t: "S", mut: "A", rI: 1 }, { t: "S", mut: "A", rI: 3 }, { t: "S", mut: "A", rI: 5 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }]
        }
      ],
      refLength: 200
    }
  };

  const filter = new Filter();
  const { mutationRate, alleleDifferences } = filter._compare(queryCoreProfile, referenceCoreProfile);
  t.is(mutationRate, 5 / 500);
  t.deepEqual(alleleDifferences, {
    commonGene: {
      commonGeneQuery: {
        length: 70,
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
        length: 200,
        variance: 1,
        bestRefAllele: "commonWithDuplicatesReference1"
      },
      commonWithDuplicatesQuery2: {
        length: 200,
        variance: 2,
        bestRefAllele: "commonWithDuplicatesReference2"
      },
      commonWithDuplicatesQuery3: {
        length: 150,
        variance: 3,
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
      expected: 51
    },
    {
      allele: { rR: [100, 50] },
      expected: 51
    },
    {
      allele: { rR: [1, 50] },
      expected: 1
    },
    {
      allele: { rR: [1, 100] },
      expected: 51
    },
    {
      allele: { rR: [1, 75] },
      expected: 26
    },
    {
      allele: { rR: [75, 100] },
      expected: 26
    },
    {
      allele: { rR: [75, 150] },
      expected: 26
    },
    {
      allele: { rR: [100, 150] },
      expected: 1
    },
    {
      allele: { rR: [101, 150] },
      expected: 0
    },
    {
      allele: { rR: [75, 80] },
      expected: 6
    },
    {
      allele: { rR: [1, 150] },
      expected: 51
    }
  ];
  _.forEach(testCases, ({ allele, expected }) => {
    t.is(
      filter._overlap(queryAllele, allele),
      expected,
      JSON.stringify(allele)
    );
    t.is(
      filter._overlap(allele, queryAllele),
      expected,
      `Backward: ${JSON.stringify(allele)}`
    );
  });
});
