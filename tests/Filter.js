const _ = require("lodash");
const { test } = require("ava");
const sinon = require("sinon");

const { Filter } = require("../src/Filter");

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
    anotherCommonGene: {
      alleles: [
        {
          id: "anotherCommonGeneQuery",
          muts: [{ t: "S", mut: "A", rI: 100 }],
          rR: [71, 150]
        }
      ]
    },
    multipleInQuery: {
      alleles: [
        {
          id: "multipleInQuery1",
          muts: [{ t: "S", mut: "A", rI: 11 }],
          rR: [1, 200]
        },
        {
          id: "multipleInQuery2",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "A", rI: 13 }, { t: "S", mut: "A", rI: 15 }],
          rR: [10, 190]
        }
      ]
    },
    multipleInReference: {
      alleles: [
        {
          id: "multipleInReference1",
          muts: [{ t: "S", mut: "A", rI: 11 }],
          rR: [1, 200]
        }
      ]
    },
    multipleInBoth: {
      alleles: [
        {
          id: "multipleInBoth1",
          muts: [{ t: "S", mut: "A", rI: 11 }],
          rR: [1, 200]
        },
        {
          id: "multipleInBoth2",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "A", rI: 13 }, { t: "S", mut: "A", rI: 15 }],
          rR: [10, 190]
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
    anotherCommonGene: {
      alleles: [
        {
          id: "anotherCommonGeneReference",
          muts: [{ t: "S", mut: "A", rI: 103 }, { t: "S", mut: "A", rI: 105 }],
          rR: [11, 110]
        }
      ]
    },
    multipleInQuery: {
      alleles: [
        {
          id: "multipleInQuery3",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "T", rI: 100 }],
          rR: [5, 160]
        }
      ]
    },
    multipleInReference: {
      alleles: [
        {
          id: "multipleInReference2",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "T", rI: 100 }],
          rR: [5, 160]
        },
        {
          id: "multipleInReference3",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }],
          rR: [5, 160]
        }
      ]
    },
    multipleInBoth: {
      alleles: [
        {
          id: "multipleInBoth3",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "T", rI: 100 }],
          rR: [5, 160]
        },
        {
          id: "multipleInBoth4",
          muts: [{ t: "S", mut: "A", rI: 11 }, { t: "S", mut: "T", rI: 100 }, { t: "S", mut: "T", rI: 102 }],
          rR: [5, 160]
        }
      ]
    }
  };

  const filter = new Filter();
  const { mutationRate, alleleDifferences } = filter._compare(
    queryCoreProfile,
    referenceCoreProfile
  );
  t.is(mutationRate, 5 / 100);
  t.deepEqual(alleleDifferences, {
    commonGene: {
      commonGeneQuery: {
        length: 60,
        variance: 2,
        bestRefAllele: "commonGeneReference"
      }
    },
    anotherCommonGene: {
      anotherCommonGeneQuery: {
        length: 40,
        variance: 3,
        bestRefAllele: "anotherCommonGeneReference"
      }
    }
  });
});

test("Calculate filtered alleles", t => {
  const queryCoreProfile = {
    commonGene: { alleles: [{ id: "commonGeneQuery" }] },
    anotherCommonGene: { alleles: [{ id: "anotherCommonGeneQuery" }] },
    multipleInQuery: {
      alleles: [{ id: "multipleInQuery1" }, { id: "multipleInQuery2" }]
    },
    multipleInReference: {
      alleles: [{ id: "multipleInReference1" }]
    },
    multipleInBoth: {
      alleles: [{ id: "multipleInBoth1" }, { id: "multipleInBoth2" }]
    },
    onlyInQuery: { alleles: [{ id: "onlyInQuery" }] }
  };
  const referenceCoreProfile = {
    onlyInReference: { alleles: [{ id: "onlyInReference" }] },
    commonGene: { alleles: [{ id: "commonGeneReference" }] },
    anotherCommonGene: { alleles: [{ id: "anotherCommonGeneReference" }] },
    multipleInQuery: {
      alleles: [{ id: "multipleInQuery3" }]
    },
    multipleInReference: {
      alleles: [{ id: "multipleInReference2" }, { id: "multipleInReference3" }]
    },
    multipleInBoth: {
      alleles: [{ id: "multipleInBoth3" }, { id: "multipleInBoth4" }]
    }
  };

  const filter = new Filter();
  const fakeAlleleDifferences = {
    commonGene: {
      commonGeneQuery: {
        length: 1000,
        variance: 5,
        bestRefAllele: "commonGeneReference"
      }
    },
    anotherCommonGene: {
      anotherCommonGeneQuery: {
        length: 400,
        variance: 50,
        bestRefAllele: "anotherCommonGeneReference"
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
      familyId: "anotherCommonGene",
      alleleId: "anotherCommonGeneQuery",
      variance: 50
    },
    {
      familyId: "multipleInBoth",
      alleleId: "multipleInBoth1"
    },
    {
      familyId: "multipleInBoth",
      alleleId: "multipleInBoth2"
    },
    {
      familyId: "multipleInQuery",
      alleleId: "multipleInQuery1"
    },
    {
      familyId: "multipleInQuery",
      alleleId: "multipleInQuery2"
    },
    {
      familyId: "multipleInReference",
      alleleId: "multipleInReference1"
    },
    {
      familyId: "onlyInQuery",
      alleleId: "onlyInQuery"
    }
  ];

  t.deepEqual(_.sortBy(filteredAlleles, "alleleId"), expected);
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
