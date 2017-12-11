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
