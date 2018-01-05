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

test("More Compare Alignment", t => {
  const coreAnalyser = new Core();
  const testCases = {
    bigInsertion: {
      hitSequence: "TT------TT",
      querySequence: "TTTTTTTTTT",
      expected: [
        {
          t: "I",
          wt: "------",
          mut: "TTTTTT",
          refOffset: 1,
          queryOffset: 2
        }
      ]
    },
    bigDeletion: {
      hitSequence: "TTTTTTTTTT",
      querySequence: "TT------TT",
      expected: [
        {
          t: "D",
          wt: "TTTTTT",
          mut: "------",
          refOffset: 2,
          queryOffset: 1
        }
      ]
    },
    bitMulti: {
      hitSequence: "TTTTT-----TTTTTTTTTTTTTTT",
      querySequence: "TTTTTTTTTT-----AAAAATTTTT",
      expected: [
        {
          t: "I",
          wt: "-----",
          mut: "TTTTT",
          refOffset: 4,
          queryOffset: 5
        },
        {
          t: "D",
          wt: "TTTTT",
          mut: "-----",
          refOffset: 5,
          queryOffset: 9
        },
        {
          t: "S",
          wt: "TTTTT",
          mut: "AAAAA",
          refOffset: 10,
          queryOffset: 10
        }
      ]
    }
  };
  _.forEach(testCases, ({ hitSequence, querySequence, expected }, testName) => {
    const actual = coreAnalyser._compareAlignment(hitSequence, querySequence);
    t.deepEqual(actual, expected, testName);
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
    bigInsertion: {
      hitStart: 1,
      hitEnd: 4,
      hitSequence: "TT------TT",
      querySequence: "TTTTTTTTTT",
      queryStart: 101,
      queryEnd: 110,
      mutations: [
        {
          t: "I",
          wt: "------",
          mut: "TTTTTT",
          rI: 2,
          qI: 103
        }
      ],
      reverse: false
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
    bigDeletion: {
      hitStart: 1,
      hitEnd: 10,
      hitSequence: "TTTTTTTTTT",
      querySequence: "TT------TT",
      queryStart: 101,
      queryEnd: 104,
      mutations: [
        {
          t: "D",
          wt: "TTTTTT",
          mut: "------",
          rI: 3,
          qI: 102
        }
      ],
      reverse: false
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
    },
    multiReverseSubstitution: {
      hitStart: 1,
      hitEnd: 10,
      hitSequence: "TTTTTTTTTT",
      querySequence: "TTTCCCGGCT",
      queryStart: 101,
      queryEnd: 110,
      mutations: [
        {
          t: "S",
          wt: "AAAAAA",
          mut: "GCCGGG",
          rI: 2,
          qI: 109
        }
      ],
      reverse: true
    },
    longerExample: {
      hitStart: 1,
      hitEnd: 25,
      hitSequence: "TTTTTTTTTTTTTTTTTTTTT-TTT--T",
      querySequence: "TTTATTTAATTT--TTT--ACTTTTTTT",
      queryStart: 1,
      queryEnd: 24,
      mutations: [
        {
          t: "S",
          wt: "T",
          mut: "A",
          rI: 4,
          qI: 4
        },
        {
          t: "S",
          wt: "TT",
          mut: "AA",
          rI: 8,
          qI: 8
        },
        {
          t: "D",
          wt: "TT",
          mut: "--",
          rI: 13,
          qI: 12
        },
        {
          t: "D",
          wt: "TT",
          mut: "--",
          rI: 18,
          qI: 15
        },
        {
          t: "S",
          wt: "TT",
          mut: "AC",
          rI: 20,
          qI: 16
        },
        {
          t: "I",
          wt: "-",
          mut: "T",
          rI: 21,
          qI: 18
        },
        {
          t: "I",
          wt: "--",
          mut: "TT",
          rI: 24,
          qI: 22
        }
      ]
    },
    anotherReverse: {
      hitStart: 1,
      hitEnd: 25,
      hitSequence: "A--AAA-AAAAAAAAAAAAAAAAAAAAA",
      querySequence: "AAAAAAAGT--AAA--AAATTAAATAAA",
      queryStart: 1,
      queryEnd: 24,
      mutations: [
        {
          t: "S",
          wt: "T",
          mut: "A",
          rI: 4,
          qI: 21
        },
        {
          t: "S",
          wt: "TT",
          mut: "AA",
          rI: 8,
          qI: 17
        },
        {
          t: "D",
          wt: "TT",
          mut: "--",
          rI: 13,
          qI: 13
        },
        {
          t: "D",
          wt: "TT",
          mut: "--",
          rI: 18,
          qI: 10
        },
        {
          t: "S",
          wt: "TT",
          mut: "AC",
          rI: 20,
          qI: 9
        },
        {
          t: "I",
          wt: "-",
          mut: "T",
          rI: 21,
          qI: 7
        },
        {
          t: "I",
          wt: "--",
          mut: "TT",
          rI: 24,
          qI: 3
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
      config: {
        minMatchCoverage: 90,
        geneLengths: {
          geneA: 100,
          geneB: 200
        }
      },
      hits: [
        { hitId: "geneA", hitStart: 1, hitEnd: 20, reverse: false }, // <- Drop
        { hitId: "geneB", hitStart: 1, hitEnd: 95, reverse: false }, // <- Drop
        { hitId: "geneA", hitStart: 1, hitEnd: 95, reverse: false },
        { hitId: "geneA", hitStart: 1, hitEnd: 90, reverse: false },
        { hitId: "geneB", hitStart: 1, hitEnd: 190, reverse: true },
        { hitId: "geneA", hitStart: 80, hitEnd: 100, reverse: true }, // <- Drop
        { hitId: "geneA", hitStart: 80, hitEnd: 175, reverse: true }
      ],
      expected: [
        { hitId: "geneA", hitStart: 1, hitEnd: 95, reverse: false },
        { hitId: "geneA", hitStart: 1, hitEnd: 90, reverse: false },
        { hitId: "geneB", hitStart: 1, hitEnd: 190, reverse: true },
        { hitId: "geneA", hitStart: 80, hitEnd: 175, reverse: true }
      ]
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
    },
    queryLength: 1000
  };
  const coreAnalyser = new Core(config);
  const hits = [
    { hitId: "geneA", queryStart: 1, queryEnd: 100, full: true },
    { hitId: "geneA", queryStart: 1, queryEnd: 100, full: true },
    { hitId: "geneC", queryStart: 1, queryEnd: 80, full: false },
    { hitId: "geneC", queryStart: 1, queryEnd: 70, full: false }
  ];
  const expected = {
    familiesMatched: 2,
    completeAlleles: 2,
    kernelSize: 4,
    percentKernelMatched: 66.7,
    totalMatchLength: 350
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
    { hitId: "geneA", queryStart: 1001, queryEnd: 1100, hitStart: 1, hitEnd: 100, reverse: false },
    { hitId: "geneA", queryStart: 2001, queryEnd: 2100, hitStart: 1, hitEnd: 100, reverse: true },
    { hitId: "geneB", queryStart: 3001, queryEnd: 3080, hitStart: 1, hitEnd: 80, reverse: false }, // Dropped
    { hitId: "geneB", queryStart: 4001, queryEnd: 4100, hitStart: 1, hitEnd: 100, reverse: false },
    { hitId: "geneB", queryStart: 5001, queryEnd: 5100, hitStart: 1, hitEnd: 100, reverse: true },
    { hitId: "geneC", queryStart: 6001, queryEnd: 6080, hitStart: 1, hitEnd: 80, reverse: false },
    { hitId: "geneC", queryStart: 7001, queryEnd: 7070, hitStart: 1, hitEnd: 70, reverse: false } // Dropped
  ];
  const coreAnalyser = new Core(config);
  coreAnalyser.addMutations = sinon.stub().returns([]);
  coreAnalyser.addQueryHash = sinon.stub().returns([]);
  coreAnalyser._removeOverlappingHits = sinon.spy();
  const summaryData = {
    assemblyId: "query",
    speciesId: 123,
    queryLength: 1000
  };
  const actual = coreAnalyser.getCore(hits, summaryData);
  t.is(actual.coreSummary.assemblyId, "query");
  t.is(actual.coreProfile.id, "query");
  t.is(actual.coreSummary.speciesId, 123);
  t.is(actual.coreSummary.familiesMatched, 3);
  t.is(actual.coreSummary.completeAlleles, 4);
  t.is(actual.coreSummary.kernelSize, 5);
  t.is(actual.coreProfile.size, 5);
  t.is(actual.coreSummary.percentKernelMatched, 100.0);
  t.is(coreAnalyser.addMutations.callCount, 5);
  t.is(coreAnalyser.addQueryHash.callCount, 5);
  t.true(coreAnalyser._removeOverlappingHits.calledOnce);
  t.is(actual.coreSummary.percentAssemblyMatched, 48.0);
  t.is(actual.coreProfile.nt, 480);
});

test("Hit filtering order", t => {
  const sandbox = sinon.sandbox.create();

  const fakeHits = [{ fake: "hit" }];
  const fakeSummaryData = {};

  const _removePartialHitsStub = sandbox.stub(
    Core.prototype,
    "_removePartialHits"
  );
  const _removeShortHitsStub = sandbox.stub(Core.prototype, "_removeShortHits");
  const _removeOverlappingHitsStub = sandbox.stub(
    Core.prototype,
    "_removeOverlappingHits"
  );
  sandbox.stub(Core.prototype, "addQueryHash");
  sandbox.stub(Core.prototype, "addMutations");
  sandbox.stub(Core.prototype, "getHitStats").returns({
    familiesMatched: 100,
    completeAlleles: 100,
    kernelSize: 100,
    percentKernelMatched: 100,
    totalMatchLength: 100
  });
  const formatCoreProfileStub = sandbox
    .stub(Core.prototype, "formatCoreProfile")
    .returns({});

  const coreAnalyser = new Core({});
  coreAnalyser.getCore(fakeHits, fakeSummaryData);
  // The order of these could impact the results
  t.true(_removePartialHitsStub.calledBefore(_removeShortHitsStub));
  t.true(_removeShortHitsStub.calledBefore(_removeOverlappingHitsStub));
  t.true(_removeOverlappingHitsStub.calledBefore(formatCoreProfileStub));
  sandbox.restore();
});

test("Hash sequence", t => {
  const coreAnalyser = new Core({});
  const testCases = [
    ["acgt", "2108994e17f6cca9ff2352ada92b6511db076034"],
    ["ACGT", "2108994e17f6cca9ff2352ada92b6511db076034"],
    ["a\tC\n-G t.", "2108994e17f6cca9ff2352ada92b6511db076034"]
  ];
  _.forEach(testCases, ([sequence, expected]) => {
    const actual = coreAnalyser._hashSequence(sequence);
    t.is(actual, expected, sequence);
  });
});

test("Add query hash", t => {
  const coreAnalyser = new Core({});
  const testCases = [
    {
      querySequence: "AACGT",
      reverse: false,
      queryHash: "2497ee7de61c48a79fbf5e21c5ca2822e40906c9"
    },
    {
      querySequence: "aacgt",
      reverse: false,
      queryHash: "2497ee7de61c48a79fbf5e21c5ca2822e40906c9"
    },
    {
      querySequence: "a-A\nC.g\nt ",
      reverse: false,
      queryHash: "2497ee7de61c48a79fbf5e21c5ca2822e40906c9"
    },
    {
      querySequence: "AACGT",
      reverse: true,
      queryHash: "cd65ee62b2e080b8e7e648ebde704a1658570335"
    },
    {
      querySequence: "aacgt",
      reverse: true,
      queryHash: "cd65ee62b2e080b8e7e648ebde704a1658570335"
    },
    {
      querySequence: "a-A\nC.g\nt ",
      reverse: true,
      queryHash: "cd65ee62b2e080b8e7e648ebde704a1658570335"
    }
  ];
  _.forEach(testCases, hit => {
    const { queryHash: expected, reverse, querySequence } = hit;
    delete hit.queryHash;
    coreAnalyser.addQueryHash(hit);
    t.is(hit.queryHash, expected, JSON.stringify({ reverse, querySequence }));
  });
});

test("Format Core Profile", t => {
  const config = {
    geneLengths: {
      geneA: 10,
      geneB: 10,
      geneC: 10,
      geneD: 10
    }
  };
  const hits = [
    {
      hitId: "geneA",
      queryHash: "abcd1234",
      mutations: [
        {
          t: "S",
          wt: "T",
          mut: "A",
          rI: 4,
          qI: 4
        }
      ],
      full: true,
      queryId: "contigA",
      queryStart: 1,
      queryEnd: 10,
      hitStart: 1,
      hitEnd: 10,
      pIdent: 90.0,
      eValue: 0,
      reverse: false
    },
    {
      hitId: "geneB",
      queryHash: "ijkl1234",
      mutations: [
        {
          t: "D",
          wt: "T",
          mut: "-",
          rI: 6,
          qI: 6
        },
        {
          t: "I",
          wt: "-",
          mut: "T",
          rI: 8,
          qI: 8
        }
      ],
      full: false,
      queryId: "contigB",
      queryStart: 1,
      queryEnd: 10,
      hitStart: 1,
      hitEnd: 9,
      pIdent: 80.0,
      eValue: 0,
      reverse: true
    },
    {
      hitId: "geneC",
      queryHash: "mnop1234",
      mutations: [],
      full: true,
      queryId: "contigA",
      queryStart: 1,
      queryEnd: 10,
      hitStart: 1,
      hitEnd: 10,
      pIdent: 100.0,
      eValue: 0,
      reverse: false
    },
    {
      hitId: "geneA",
      queryHash: "efgh234",
      mutations: [
        {
          t: "S",
          wt: "T",
          mut: "A",
          rI: 6,
          qI: 104
        }
      ],
      full: true,
      queryId: "contigB",
      queryStart: 101,
      queryEnd: 110,
      hitStart: 1,
      hitEnd: 10,
      pIdent: 90.0,
      eValue: 0,
      reverse: true
    }
  ];
  const expected = {
    "geneA": {
      "alleles": [
        {
          "id": "abcd1234",
          "muts": [
            {
              t: "S",
              wt: "T",
              mut: "A",
              rI: 4,
              qI: 4
            }
          ],
          "full": true,
          "qId": "contigA",
          "qR": [ 1, 10 ],
          "rR": [ 1, 10 ],
          "pid": 90.0,
          "evalue": 0,
          "r": false
        },
        {
          "id": "efgh234",
          "muts": [
            {
              t: "S",
              wt: "T",
              mut: "A",
              rI: 6,
              qI: 104
            }
          ],
          "full": true,
          "qId": "contigB",
          "qR": [ 101, 110 ],
          "rR": [ 1, 10 ],
          "pid": 90.0,
          "evalue": 0,
          "r": true
        }
      ],
      "refLength": 10
    },
    "geneB": {
      "alleles": [
        {
          "id": "ijkl1234",
          "muts": [
            {
              t: "D",
              wt: "T",
              mut: "-",
              rI: 6,
              qI: 6
            },
            {
              t: "I",
              wt: "-",
              mut: "T",
              rI: 8,
              qI: 8
            }
          ],
          "full": false,
          "qId": "contigB",
          "qR": [ 1, 10 ],
          "rR": [ 1, 9 ],
          "pid": 80.0,
          "evalue": 0,
          "r": true
        }
      ],
      "refLength": 10
    },
    "geneC": {
      "alleles": [
        {
          "id": "mnop1234",
          "muts": [],
          "full": true,
          "qId": "contigA",
          "qR": [ 1, 10 ],
          "rR": [ 1, 10 ],
          "pid": 100.0,
          "evalue": 0,
          "r": false
        }
      ],
      "refLength": 10
    }
  };
  const coreAnalyser = new Core(config);
  const actual = coreAnalyser.formatCoreProfile(hits);
  t.deepEqual(actual, expected);
});
