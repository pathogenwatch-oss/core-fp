const _ = require("lodash");
const { test } = require("ava");
const sinon = require("sinon");

const { Core } = require("../src/Core");

test("Compliment", t => {
  const coreAnalyser = new Core();
  t.is(coreAnalyser._compliment("acgt"), "acgt");
  t.is(coreAnalyser._compliment("aaaa"), "tttt");
  t.is(coreAnalyser._compliment("acgtACGT"), "ACGTacgt");
  t.is(coreAnalyser._compliment("an-A"), "T-nt");
});

test("Compare Alignment", t => {
  const coreAnalyser = new Core();
  const testCases = [
    { seq: "TTT--TTTT" },
    { seq: "TTT--ATTT", expected: [{t: "S", wt: "T",  mut: "A",   refOffset: 3, queryOffset: 3}]},
    { seq: "TTA--ATTT", expected: [{t: "S", wt: "TT", mut: "AA",  refOffset: 2, queryOffset: 2}]},
    { seq: "TTT--AATT", expected: [{t: "S", wt: "TT", mut: "AA",  refOffset: 3, queryOffset: 3}]},
    { seq: "TTTA-TTTT", expected: [{t: "I", wt: "-",  mut: "A",   refOffset: 2, queryOffset: 3}]},
    { seq: "TTTAATTTT", expected: [{t: "I", wt: "--", mut: "AA",  refOffset: 2, queryOffset: 3}]},
    { seq: "TTT---TTT", expected: [{t: "D", wt: "T",  mut: "-",   refOffset: 3, queryOffset: 2}]},
    { seq: "TTT----TT", expected: [{t: "D", wt: "TT", mut: "--",  refOffset: 3, queryOffset: 2}]},
    { seq: "TAA--AATT", expected: [{t: "S", wt: "TTTT", mut: "AAAA",  refOffset: 1, queryOffset: 1}]},
    { seq: "AAAAAAATT", expected: [
      {t: "S", wt: "TTT", mut: "AAA",  refOffset: 0, queryOffset: 0},
      {t: "I", wt: "--", mut: "AA",  refOffset: 2, queryOffset: 3},
      {t: "S", wt: "TT", mut: "AA",  refOffset: 3, queryOffset: 5}
    ]}
  ];
  const { seq: reference } = testCases.shift();
  _.forEach(testCases, ({ seq, expected }) => {
    const actual = coreAnalyser._compareAlignment(reference, seq);
    t.deepEqual(actual, expected, `${reference} => ${seq}`);
  });
});

test("Add Mutations", t => {
  const coreAnalyser = new Core();
  const testCases = {
    forwardSubstitution: {
      hitStart: 1,
      hitEnd: 5,
      hitSequence: "AAAAA",
      querySequence: "AAACA",
      queryStart: 101,
      queryEnd: 105,
      mutations: [
        {
          t: "S",
          wt: "A",
          mut: "C",
          rI: 4,
          qI: 104
        }
      ],
      reverse: false
    },
    reverseSubstitution: {
      hitStart: 1,
      hitEnd: 5,
      hitSequence: "TTTTT",
      querySequence: "TTTGT",
      queryStart: 101,
      queryEnd: 105,
      mutations: [
        {
          t: "S",
          wt: "A",
          mut: "C",
          rI: 2,
          qI: 104
        }
      ],
      reverse: true
    },
    forwardInsertion: {
      hitStart: 1,
      hitEnd: 4,
      hitSequence: "AAA-A",
      querySequence: "AAACA",
      queryStart: 101,
      queryEnd: 105,
      mutations: [
        {
          t: "I",
          wt: "-",
          mut: "C",
          rI: 3,
          qI: 104
        }
      ],
      reverse: false
    },
    reverseInsertion: {
      hitStart: 1,
      hitEnd: 4,
      hitSequence: "TTT-T",
      querySequence: "TTTGT",
      queryStart: 101,
      queryEnd: 105,
      mutations: [
        {
          t: "I",
          wt: "-",
          mut: "C",
          rI: 1,
          qI: 104
        }
      ],
      reverse: true
    },
    forwardDeletion: {
      hitStart: 1,
      hitEnd: 5,
      hitSequence: "AAAAA",
      querySequence: "AAA-A",
      queryStart: 101,
      queryEnd: 104,
      mutations: [
        {
          t: "D",
          wt: "A",
          mut: "-",
          rI: 4,
          qI: 103
        }
      ],
      reverse: false
    },
    reverseDeletion: {
      hitStart: 1,
      hitEnd: 5,
      hitSequence: "TTTTT",
      querySequence: "TTT-T",
      queryStart: 101,
      queryEnd: 104,
      mutations: [
        {
          t: "D",
          wt: "A",
          mut: "-",
          rI: 2,
          qI: 104
        }
      ],
      reverse: true
    },
    multiSubstitution: {
      hitStart: 1,
      hitEnd: 8,
      hitSequence: "TTTTTTT",
      querySequence: "TCCGACT",
      queryStart: 101,
      queryEnd: 108,
      mutations: [
        {
          t: "S",
          wt: "AAAAA",
          mut: "GTCGG",
          rI: 2,
          qI: 107
        }
      ],
      reverse: true
    },
    combination: {
      hitStart: 1,
      hitEnd: 8,
      hitSequence: "TT--TTTTTT",
      querySequence: "TGCCA--TCG",
      queryStart: 101,
      queryEnd: 108,
      mutations: [
        {
          t: "S",
          wt: "AA",
          mut: "CG",
          rI: 1,
          qI: 108
        },
        {
          t: "D",
          wt: "AA",
          mut: "--",
          rI: 4,
          qI: 106
        },
        {
          t: "S",
          wt: "A",
          mut: "T",
          rI: 6,
          qI: 105
        },
        {
          t: "I",
          wt: "--",
          mut: "GG",
          rI: 6,
          qI: 104
        },
        {
          t: "S",
          wt: "A",
          mut: "C",
          rI: 7,
          qI: 102
        }
      ],
      reverse: true
    }
  };
  _.forEach(testCases, (testCase, testName) => {
    const { mutations: expected, hitSequence, querySequence } = testCase;
    delete testCase.mutations;
    coreAnalyser.addMutations(testCase);
    t.deepEqual(testCase.mutations, expected, `${testName}: ${hitSequence} => ${querySequence}`);
  });
});

test("Percentage identity", t => {
  const coreAnalyser = new Core();
  t.is(
    coreAnalyser._pIdent({
      matchingBases: 10,
      alignmentLength: 100
    }),
    10
  );
});

test("Remove Overlapping hits", t => {
  const coreAnalyser = new Core();
  const testCases = {
    noOverlap: {
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo" },
        { queryStart: 101, queryEnd: 200, queryId: "foo" }
      ],
      output: [
        { queryStart: 1, queryEnd: 100, queryId: "foo" },
        { queryStart: 101, queryEnd: 200, queryId: "foo" }
      ]
    },
    differentContigs: {
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo" },
        { queryStart: 1, queryEnd: 100, queryId: "bar" }
      ],
      output: [
        { queryStart: 1, queryEnd: 100, queryId: "foo" },
        { queryStart: 1, queryEnd: 100, queryId: "bar" }
      ]
    },
    littleOverlap: {
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo" },
        { queryStart: 91, queryEnd: 190, queryId: "foo" }
      ],
      output: [
        { queryStart: 1, queryEnd: 100, queryId: "foo" },
        { queryStart: 91, queryEnd: 190, queryId: "foo" }
      ]
    },
    overlapLeft: {
      // AAAAA    <- Better
      //    BBBBB
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 90 },
        { queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 80 }
      ],
      output: [{ queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 90 }]
    },
    anotherOverlapLeft: {
      // AAAAA
      //    BBBBB <- Better
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 80 },
        { queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 90 }
      ],
      output: [{ queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 90 }]
    },
    overlapMiddleBottom: {
      // AAAAAAAAA
      //   BBBBB <- Better
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 80 },
        { queryStart: 21, queryEnd: 80, queryId: "foo", pIdent: 90 }
      ],
      output: [{ queryStart: 21, queryEnd: 80, queryId: "foo", pIdent: 90 }]
    },
    overlapMiddleTop: {
      // AAAAAAAAA <- Better
      //   BBBBB
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 90 },
        { queryStart: 21, queryEnd: 80, queryId: "foo", pIdent: 80 }
      ],
      output: [{ queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 90 }]
    },
    moreMatches: {
      //   AAAAA
      // BBBBBBB <- Better
      input: [
        { queryStart: 41, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 60 },
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 100 }
      ],
      output: [{ queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 100 }]
    },
    hitName: {
      // AAAAAAA <- Better
      //   BBBBBBB
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 100, hitId: "A" },
        { queryStart: 41, queryEnd: 140, queryId: "foo", pIdent: 100, matchingBases: 100, hitId: "B" }
      ],
      output: [{ queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 100, hitId: "A" }]
    },
    startFirst: {
      // AAAAAAA <- Better
      //   BBBBBBB
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 100, hitId: "A" },
        { queryStart: 41, queryEnd: 140, queryId: "foo", pIdent: 100, matchingBases: 100, hitId: "A" }
      ],
      output: [{ queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 100, hitId: "A" }]
    },
    endFirst: {
      // I'm not sure if this can actually happen...
      // AAAAA
      // BBBB  <- Better
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 50, matchingBases: 60, hitId: "A" },
        { queryStart: 1, queryEnd: 80, queryId: "foo", pIdent: 50, matchingBases: 60, hitId: "A" }
      ],
      output: [{ queryStart: 1, queryEnd: 80, queryId: "foo", pIdent: 50, matchingBases: 60, hitId: "A" }]
    },
    identical: {
      // AAAAA
      // BBBBB <- Better
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 100, hitId: "A" },
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 100, hitId: "A" }
      ],
      output: [{ queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 100, matchingBases: 100, hitId: "A" }]
    },
    threeHits: {
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 80 },
        { queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 90 },
        { queryStart: 151, queryEnd: 250, queryId: "foo", pIdent: 85 }
      ],
      output: [
        { queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 90 },
        { queryStart: 151, queryEnd: 250, queryId: "foo", pIdent: 85 }
      ]
    },
    middleOfThreeHits: {
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 80 },
        { queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 90 },
        { queryStart: 121, queryEnd: 220, queryId: "foo", pIdent: 85 }
      ],
      output: [{ queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 90 }]
    },
    lastOfThreeHits: {
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 80 },
        { queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 90 },
        { queryStart: 121, queryEnd: 220, queryId: "foo", pIdent: 95 }
      ],
      // It's not obvious whether we should keep the first hit; my suggestion is
      // that this scenario is unlikely and this is the simplest solution to
      // implement.
      output: [{ queryStart: 121, queryEnd: 220, queryId: "foo", pIdent: 95 }]
    },
    fourHits: {
      input: [
        { queryStart: 1, queryEnd: 100, queryId: "foo", pIdent: 80 },
        { queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 90 },
        { queryStart: 121, queryEnd: 220, queryId: "foo", pIdent: 85 },
        { queryStart: 181, queryEnd: 280, queryId: "foo", pIdent: 95 }
      ],
      // This is very unlikely but this makes some sort of sense.
      output: [
        { queryStart: 61, queryEnd: 160, queryId: "foo", pIdent: 90 },
        { queryStart: 181, queryEnd: 280, queryId: "foo", pIdent: 95 }
      ]
    }
  };
  _.forEach(testCases, ({ input, output: expected }, testName) => {
    coreAnalyser._removeOverlappingHits(input);
    const actual = input;
    t.deepEqual(actual, expected, testName);
  });
});

test("Remove short hits", t => {
  const testCases = [
    {
      config: { minMatchCoverage: 30 },
      hits: [
        { hitStart: 1, hitEnd: 100, reverse: false },
        { hitStart: 1, hitEnd: 20, reverse: false },
        { hitStart: 1, hitEnd: 100, reverse: true },
        { hitStart: 80, hitEnd: 100, reverse: true }
      ],
      expected: [{ hitStart: 1, hitEnd: 100, reverse: false }, { hitStart: 1, hitEnd: 100, reverse: true }]
    }
  ];
  _.forEach(testCases, ({ config, hits, expected }) => {
    const coreAnalyser = new Core(config);
    coreAnalyser._removeShortHits(hits);
    t.deepEqual(hits, expected);
  });
});

test("Remove partial matches", t => {
  const testCases = {
    allUnique: {
      config: {
        geneLengths: {
          foo: 100,
          bar: 100,
          baz: 100
        }
      },
      hits: [
        { hitId: "foo", hitStart: 1, hitEnd: 100, reverse: false },
        { hitId: "bar", hitStart: 1, hitEnd: 80, reverse: false },
        { hitId: "baz", hitStart: 1, hitEnd: 100, reverse: false }
      ],
      expected: [
        { hitId: "foo", hitStart: 1, hitEnd: 100, reverse: false, full: true },
        { hitId: "bar", hitStart: 1, hitEnd: 80, reverse: false, full: false },
        { hitId: "baz", hitStart: 1, hitEnd: 100, reverse: false, full: true }
      ]
    },
    duplicates: {
      config: {
        geneLengths: {
          foo: 100,
          bar: 100,
          baz: 100
        }
      },
      hits: [
        { hitId: "foo", hitStart: 1, hitEnd: 100, reverse: false },
        { hitId: "foo", hitStart: 1, hitEnd: 100, reverse: true },
        { hitId: "bar", hitStart: 1, hitEnd: 80, reverse: false },
        { hitId: "bar", hitStart: 1, hitEnd: 100, reverse: false },
        { hitId: "bar", hitStart: 1, hitEnd: 100, reverse: true },
        { hitId: "baz", hitStart: 1, hitEnd: 80, reverse: false },
        { hitId: "baz", hitStart: 1, hitEnd: 70, reverse: false }
      ],
      expected: [
        { hitId: "foo", hitStart: 1, hitEnd: 100, reverse: false, full: true },
        { hitId: "foo", hitStart: 1, hitEnd: 100, reverse: true, full: true },
        { hitId: "bar", hitStart: 1, hitEnd: 100, reverse: false, full: true },
        { hitId: "bar", hitStart: 1, hitEnd: 100, reverse: true, full: true },
        { hitId: "baz", hitStart: 1, hitEnd: 80, reverse: false, full: false },
        { hitId: "baz", hitStart: 1, hitEnd: 70, reverse: false, full: false }
      ]
    }
  };
  _.forEach(testCases, ({ config, hits, expected }, testName) => {
    const coreAnalyser = new Core(config);
    coreAnalyser._removePartialHits(hits);
    t.deepEqual(hits, expected, testName);
  });
});

test("Get Hit Stats", t => {
  const config = {
    geneLengths: {
      geneA: 100,
      geneB: 100,
      geneC: 100
    }
  };
  const coreAnalyser = new Core(config);
  const hits = [
    { hitId: "geneA", full: true },
    { hitId: "geneA", full: true },
    { hitId: "geneC", full: false },
    { hitId: "geneC", full: false }
  ];
  const expected = {
    familiesMatched: 2,
    completeAlleles: 2,
    kernelSize: 4,
    percentKernelMatched: 66.7
  };
  t.deepEqual(coreAnalyser.getHitStats(hits), expected);
});

test("Get Core", t => {
  const config = {
    geneLengths: {
      geneA: 100,
      geneB: 100,
      geneC: 100
    },
    minMatchCoverage: 75
  };
  const hits = [
    { hitId: "geneA", hitStart: 1, hitEnd: 100, reverse: false },
    { hitId: "geneA", hitStart: 1, hitEnd: 100, reverse: true },
    { hitId: "geneB", hitStart: 1, hitEnd: 80, reverse: false },
    { hitId: "geneB", hitStart: 1, hitEnd: 100, reverse: false },
    { hitId: "geneB", hitStart: 1, hitEnd: 100, reverse: true },
    { hitId: "geneC", hitStart: 1, hitEnd: 80, reverse: false },
    { hitId: "geneC", hitStart: 1, hitEnd: 70, reverse: false }
  ];
  const coreAnalyser = new Core(config);
  coreAnalyser.addMutations = sinon.stub().returns([]);
  coreAnalyser._removeOverlappingHits = sinon.spy();
  const summaryData = {
    assemblyId: "query",
    speciesId: 123
  };
  const actual = coreAnalyser.getCore(hits, summaryData);
  t.is(actual.coreSummary.assemblyId, "query");
  t.is(actual.coreSummary.speciesId, 123);
  t.is(actual.coreSummary.familiesMatched, 3);
  t.is(actual.coreSummary.completeAlleles, 4);
  t.is(actual.coreSummary.kernelSize, 5);
  t.is(actual.coreSummary.percentKernelMatched, 100.0);
  t.is(coreAnalyser.addMutations.callCount, 5);
  t.true(coreAnalyser._removeOverlappingHits.calledOnce);
});
