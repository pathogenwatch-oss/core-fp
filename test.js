const { test } = require("ava");
const { BlastParser } = require("./index");
const _ = require("lodash");

test("Compliment", t => {
  const blastParser = new BlastParser();
  t.is(blastParser._compliment("acgt"), "acgt");
  t.is(blastParser._compliment("aaaa"), "tttt");
  t.is(blastParser._compliment("acgtACGT"), "ACGTacgt");
  t.is(blastParser._compliment("an-A"), "T-nt");
});

test("Compare Alignment", t => {
  const blastParser = new BlastParser();
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
    const actual = blastParser._compareAlignment(reference, seq);
    t.deepEqual(actual, expected, `${reference} => ${seq}`);
  });
});

test("Add Mutations", t => {
  const blastParser = new BlastParser();
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
      ]
    },
    reverseSubstitution: {
      hitStart: 5,
      hitEnd: 1,
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
      ]
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
      ]
    },
    reverseInsertion: {
      hitStart: 4,
      hitEnd: 1,
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
      ]
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
      ]
    },
    reverseDeletion: {
      hitStart: 5,
      hitEnd: 1,
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
      ]
    },
    multiSubstitution: {
      hitStart: 8,
      hitEnd: 1,
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
      ]
    },
    combination: {
      hitStart: 8,
      hitEnd: 1,
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
      ]
    }
  };
  _.forEach(testCases, (testCase, testName) => {
    const { mutations: expected, hitSequence, querySequence } = testCase;
    delete testCase.mutations;
    blastParser.addMutations(testCase);
    t.deepEqual(testCase.mutations, expected, `${testName}: ${hitSequence} => ${querySequence}`);
  });
});

test("Percentage identity", t => {
  const blastParser = new BlastParser();
  t.is(
    blastParser._pIdent({
      matchingBases: 10,
      alignmentLength: 100
    }),
    10
  );
});

test("Remove Overlapping hits", t => {
  const blastParser = new BlastParser();
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
    blastParser._removeOverlappingHits(input);
    const actual = input;
    t.deepEqual(actual, expected, testName);
  });
});

test("Remove short hits", t => {
  const testCases = [
    {
      config: { minMatchCoverage: 30 },
      hits: [
        { hitStart: 1, hitEnd: 100 },
        { hitStart: 1, hitEnd: 20 },
        { hitStart: 100, hitEnd: 1 },
        { hitStart: 100, hitEnd: 80 }
      ],
      expected: [{ hitStart: 1, hitEnd: 100 }, { hitStart: 100, hitEnd: 1 }]
    }
  ];
  _.forEach(testCases, ({ config, hits, expected }) => {
    const blastParser = new BlastParser(config);
    blastParser._removeShortHits(hits);
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
        { hitId: "foo", hitStart: 1, hitEnd: 100 },
        { hitId: "bar", hitStart: 1, hitEnd: 80 },
        { hitId: "baz", hitStart: 1, hitEnd: 100 }
      ],
      expected: [
        { hitId: "foo", hitStart: 1, hitEnd: 100 },
        { hitId: "bar", hitStart: 1, hitEnd: 80 },
        { hitId: "baz", hitStart: 1, hitEnd: 100 }
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
        { hitId: "foo", hitStart: 1, hitEnd: 100 },
        { hitId: "foo", hitStart: 100, hitEnd: 1 },
        { hitId: "bar", hitStart: 1, hitEnd: 80 },
        { hitId: "bar", hitStart: 1, hitEnd: 100 },
        { hitId: "bar", hitStart: 100, hitEnd: 1 },
        { hitId: "baz", hitStart: 1, hitEnd: 80 },
        { hitId: "baz", hitStart: 1, hitEnd: 70 }
      ],
      expected: [
        { hitId: "foo", hitStart: 1, hitEnd: 100 },
        { hitId: "foo", hitStart: 100, hitEnd: 1 },
        { hitId: "bar", hitStart: 1, hitEnd: 100 },
        { hitId: "bar", hitStart: 100, hitEnd: 1 },
        { hitId: "baz", hitStart: 1, hitEnd: 80 },
        { hitId: "baz", hitStart: 1, hitEnd: 70 }
      ]
    }
  };
  _.forEach(testCases, ({ config, hits, expected }, testName) => {
    const blastParser = new BlastParser(config);
    blastParser._removePartialHits(hits);
    t.deepEqual(hits, expected, testName);
  });
});
