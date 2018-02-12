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
    coreAnalyser.tagShortHits(hits);
    coreAnalyser._removeTaggedHits(hits);
    t.deepEqual(hits, expected);
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
    { hitId: "geneA", queryStart: 1, queryEnd: 100, hitStart: 1, hitEnd: 100 },
    { hitId: "geneA", queryStart: 1, queryEnd: 100, hitStart: 1, hitEnd: 100 },
    { hitId: "geneC", queryStart: 1, queryEnd: 80, hitStart: 10, hitEnd: 90 },
    { hitId: "geneC", queryStart: 1, queryEnd: 70, hitStart: 10, hitEnd: 80 }
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
    { hitId: "geneB", queryStart: 3001, queryEnd: 3080, hitStart: 1, hitEnd: 80, reverse: false },
    { hitId: "geneB", queryStart: 4001, queryEnd: 4100, hitStart: 1, hitEnd: 100, reverse: false },
    { hitId: "geneB", queryStart: 5001, queryEnd: 5100, hitStart: 1, hitEnd: 100, reverse: true },
    { hitId: "geneC", queryStart: 6001, queryEnd: 6080, hitStart: 1, hitEnd: 80, reverse: false },
    { hitId: "geneC", queryStart: 7001, queryEnd: 7070, hitStart: 1, hitEnd: 70, reverse: false } // Dropped
  ];
  const coreAnalyser = new Core(config);
  coreAnalyser.addMutations = sinon.stub();
  coreAnalyser.addQueryHash = sinon.stub();
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
  t.is(actual.coreSummary.kernelSize, 6);
  t.is(actual.coreProfile.size, 6);
  t.is(actual.coreSummary.percentKernelMatched, 100.0);
  t.is(coreAnalyser.addMutations.callCount, 6);
  t.is(coreAnalyser.addQueryHash.callCount, 6);
  t.is(actual.coreSummary.percentAssemblyMatched, 56.0);
  t.is(actual.coreProfile.nt, 560);
});

test("Get real core", t => {
  const hits = [
    {
      hitAccession: "3",
      hitId: "vapA",
      hitSequence: "ATGCAGTTTTACCTGCAACCGCAGGCGCAGTTTACCTACTTGGGCGTAAACGGCGGCTTTACCGACAGCGAGGGGCGGCGGTCGGGCTGCTCGGCAGCGGTCAGTGGCAAATCCGCGCCGGCATTCGGGCAAAAACCCGTTTTGCTTTGCGTAACGGTGTCAATCTTCAGCCTTTTGCCGCTTTTAATGTTTTGCACAGGTCAAAATCTTTCGGCATGGAAATGGACGGCGAAAAACAGACGCTGGCAGGCAGGACGGCGCTCGAAGGGCGGTTTGGCATTGAAGCCGGTTGGAAAGGCCATATGTCCGCACGCATCGGATACGGCAAAAGGACGGACGGCGACAAAGAAGCCGCATTGTCGGTCAAATGGTTGTTTTGATGCGCCGGGAAATGTTTTGACACACAGGCGGCACACCTGCACGGCCCCGTGCGCCGCCCCGCAAACCGATCCGAACCCTGCCGCCCCGAAGGGCGGGGCATAA",
      hitStart: 1,
      hitEnd: 483,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.1 Top Hit:WHO_G Neisseria gonorrhoeae WHO G",
      querySequence: "ATGCAGTTTTACCTGCAACCGCAGGCGCAGTTTACCTACTTGGGCGTAAACGGCGGCTTTACCGACAGCGAGGGGCGGCGGTCGGGCTGCTCGGCAGCGGTCAGTGGCAAATCCGCGCCGGCATTCGGGCAAAAACCCGTTTTGCTTTGCGTAACGGTGTCAATCTTCAGCCTTTTGCCGCTTTTAATGTTTTGCACAGGTCAAAATCTTTCGGCATGGAAATGGACGGCGAAAAACAGACGCTGGCAGGCAGGACGGCGCTCGAAGGGCGGTTTGGCATTGAAGCCGGTTGGAAAGGCCATATGTCCGCACGCATCGGATACGGCAAAAGGACGGACGGCGACAAAGAAGCCGCATTGTCGGTCAAATGGTTGTTTTGATGCGCCGGGAAATGTTTTGACGCACAGGCGGCACACCTGCACGGCCCCGTGCGCCGCCCCGCAAACCGATCCGAACCCTGCCGCCCCGAAGGGCGGGGCATAA",
      queryStart: 270073,
      queryEnd: 270555,
      matchingBases: 482,
      alignmentLength: 483,
      eValue: 0,
      pIdent: 99.79
    },
    {
      hitAccession: "1",
      hitId: "group_2700",
      hitSequence: "TCATTTCCACAACGCGCGTTTCAACATAATCAACCAATCCTTCTTATCCAAAACGGGGCGTTGTGCAAACACATCGTATCGGCACGCGTCCAGTTTCTGCAAAATCAACTGCGCCCCCAACACAATCATACGGAGTTCCAAACCGATACGCCCTTTCAATTCGCGCGCCAAAGGCGAACCCGCCTTCAGCATACGGAATGCACGCCGGCACTCATACGCCATCAGCCGCTGAAACGCCGCATCCGCCCGTCCTGCTGCGATCTGTTCCTCAGAAACACCGAATTTCAACAAATCGTCCTGCGGGATATAAACCCTGCCCTTTTGCCAATCCACAGCTACATCCTGCCAAAAATTCACCAGTTGCAAAGCCGTACAAATACCGTCGCTTTGCGCTACGCACACCGCATCCGTTTTCCCGTATAAAGCCAGCATAATGCGTCCGACAGGGTTGGCGGAACGCCGGCAATAATCGGTCAGATCGCCGAAATGCGCGTACCGCGTTTTAACCACATCCTGCGAAAACGCCGAGAGCAGATCATAAAACGGCTGCAAATCCAAACCGAACGGCACAACCGCCTCGGCATCCAATCGTGCAATCAAAGGATGCGCCGACCGGCCGCCCGATGCCAACACGTCCAACTCGCGCCGCAAACCCTCCAACCCCGACAACCTGGCTTCAGACGGCATACTGCCCTCGTCCGCCATATCGTCCGCCGTCCGTGCAAACGCATACACCGCATGAACCGGCTTCCTCAACCTGCGCGGCAAAACCAGCGAACCGACGGGAAAATTCTCATAATGCCCAACCGACAT",
      hitStart: 1,
      hitEnd: 813,
      reverse: true,
      queryId: "ERR1549755.17328_4_44.7 Top Hit:WHO_K Neisseria gonorrhoeae WHO K",
      querySequence: "TCATTTCCACAACGCGCGTTTCAACATAATCAACCAATCCTTCTTATCCAAAACGGGGCGTTGTGCAAACACATCGTATCGGCACGCGTCCAGTTTCTGCAAAATCAACTGCGCCCCCAACACAATCATACGGAGTTCCAAACCGATACGCCCTTTCAATTCGCGCGCCAAAGGCGAACCCGCCTTCAGCATACGGAATGCACGCCGGCACTCATACGCCATCAGCCGCTGAAACGCCGCATCCGCCCGTCCTGCTGCGATCTGTTCCTCAGAAACACCGAATTTCAACAAATCGTCCTGCGGGATATAAACCCTGCCCTTTTGCCAATCCACAGCTACATCCTGCCAAAAATTCACCAGTTGCAAAGCCGTACAAATACCGTCGCTTTGCGCTACGCACACCGCATCCGTTTTCCCGTATAAAGCCAGCATAATGCGTCCGACAGGGTTGGCGGAACGCCGGCAATAATCGGTCAGATCGCCGAAATGCGCGTACCGCGTTTTAACCACATCCTGCGAAAACGCCGAGAGCAGATCATAAAACGGCTGCAAATCCAAACCGAACGGCACAACCGCCTCGGCATCCAATCGTGCAATCAAAGGATGCGCCGACCGGCCGCCCGATGCCAACACGTCCAACTCGCGCCGCAAACCCTCCAACCCCGACAACCTGGCTTCAGACGGCATACTGCCCTCGTCCGCCATATCGTCCGCCGTCCGTGCAAACGCATACACCGCATGAACCGGCTTCCTCAACCTGCGCGGCAAAACCAGCGAACCGACGGGAAAATTCTCATAATGCCCAACCGACAT",
      queryStart: 25576,
      queryEnd: 26388,
      matchingBases: 813,
      alignmentLength: 813,
      eValue: 0,
      pIdent: 100
    },
    {
      hitAccession: "2",
      hitId: "group_3366",
      hitSequence: "CTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGTCATTCCCGCGCTGCAATGGGACATCGGCGGCAGCGGGGCGGTTTTCCCTTCGCTCGCACTGTTTCTGCTCTGTTTCATCATAGGTATGCACAACACGGGGATGACGCTTCTGCCGGGCGGTGCAATCCGTTCGACGCACATGGCCCGGCACGGCAGCCGACTTGGGCATCGAAATCCCGCGCGTGCCGTACTATAGTGGATTAA",
      hitStart: 35,
      hitEnd: 339,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.18 Top Hit:WHO_K Neisseria gonorrhoeae WHO K",
      querySequence: "CTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGCCATTCCCGCGCTGCAATGGGACATCGGCGGCAGCGGGGCGGTTTTCCCTTCGCTCGCACTGTTTCTGCTCTGTTTCATCATAGGTATGCACAACACGGGGATGACGCTTCTGCCGGGCGGTGCAATCTGTTCGACGCACATGGCCCGGCACGGCAGCCGACTTGGGCATCGAAATCCCGCGCGTGCCGTACTATAGTGGATTAA",
      queryStart: 1,
      queryEnd: 305,
      matchingBases: 303,
      alignmentLength: 305,
      eValue: 2.6681e-156,
      pIdent: 99.34
    },
    {
      hitAccession: "0",
      hitId: "group_540",
      hitSequence: "TTACCAAGCAAACGGTTTCCGCTTCATATCCGAAAGGTTGTCAACTTCATTATCCAGCAAGAACTGCTCAAAAGCATTCCAACCTTTCTTTTCCACCAATTCTGCTTCCTGTTTATACAAGGGGACAAGCAAAGGGAAAACGATATTGTAGTGTTCGCCATAACAGACCTGAAAATCATCATCGAAATAAAATGGGGCGGAAACATACAGTGCATCCAT",
      hitStart: 1,
      hitEnd: 219,
      reverse: true,
      queryId: "ERR1549755.17328_4_44.16 Top Hit:WHO_L Neisseria gonorrhoeae WHO L",
      querySequence: "TTACCAAGCAAACGGTTTCCGCTTCATATCCGAAAGGTTGTCAACTTCATTATCCAGCAAGAACTGCTCAAAAGCATTCCAACCTTTCTTTTCCACCAATTCTGCTTCCTGTTTATACAAGGGGACAAGCAAAGGGAAAACGATATTGTAGTGTTCGCCATAACAGACCTGAAAATCATCATCGAAATAAAATGGGGCGGAAACATACAGTGCATCCAT",
      queryStart: 33105,
      queryEnd: 33323,
      matchingBases: 219,
      alignmentLength: 219,
      eValue: 3.64375e-112,
      pIdent: 100
    },
    {
      hitAccession: "0",
      hitId: "group_540",
      hitSequence: "ATGGATGCACTGTATGTTTCCGCCCCATTTTATTTCGATGATGATTTTCAGGTCTGTTATGGCGAACACTACAATATCGTTTTCCCTTTGCTTGTCCCCTTGTATAAACAGGAAGCAGAATTGGTGGAAAAGAAAGGTTGGAATGCTTTTGAGCAGTTCTTGCTGGATAATGAAGTTGACAACCTTTCGGATATGAAGCGGAAACCGTTTGCTTGGTAA",
      hitStart: 1,
      hitEnd: 219,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.10 Top Hit:WHO_M Neisseria gonorrhoeae WHO M",
      querySequence: "ATGGACGCACTGTATGTTTCCGCCCCATTTTATTTCGACGATGATTTCCAAGTCTGTTATGGCGAACACTACAATATTGTTTTCCCTTTGCTTGTCCCCTTGTATAAACAGGAAGCCGAATTGGTGGAAAAAAAGGGTTGGAATGCTTTTGAGCAGTTCTTGTTGGATAATGAAGTTGGCAACCTTTCGGATATGAATAGGAAACCGTTTGTTTGGTAA",
      queryStart: 3411,
      queryEnd: 3629,
      matchingBases: 206,
      alignmentLength: 219,
      eValue: 5.62212e-94,
      pIdent: 94.06
    },
    {
      hitAccession: "2",
      hitId: "group_3366",
      hitSequence: "ATGCGGCGGGCTGAAGCCCGCCCTGCAACCCTCTCTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGTCATTCCCGCGC",
      hitStart: 1,
      hitEnd: 146,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.13 Top Hit:WHO_K Neisseria gonorrhoeae WHO K",
      querySequence: "ATGCGGCGGGCTGAAGCCCGCCCTGCAACCCTCTCTATGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGCCATTCCCGCGC",
      queryStart: 55315,
      queryEnd: 55460,
      matchingBases: 145,
      alignmentLength: 146,
      eValue: 9.44979e-71,
      pIdent: 99.32
    },
    {
      hitAccession: "2",
      hitId: "group_3366",
      hitSequence: "TGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGTCATTCCCGCGC",
      hitStart: 38,
      hitEnd: 146,
      reverse: false,
      queryId: "ERR1549755.17328_4_44.30 Top Hit:WHO_L Neisseria gonorrhoeae WHO L",
      querySequence: "TGCACCCCCTTGCGAGCCCGACACTACGCAACATCTTGAGAACCCATCCTGTCAAGAATACCCGAACCGTCCCGATACACCGTAATCCTAAAACCCGCCATTCCCGCGC",
      queryStart: 1,
      queryEnd: 109,
      matchingBases: 108,
      alignmentLength: 109,
      eValue: 1.49168e-51,
      pIdent: 99.08
    }
  ];
  const summaryData = {
    assemblyId: "example",
    speciesId: 485,
    queryLength: 2155105
  };
  const coreAnalyser = new Core({
    minMatchCoverage: 80.0,
    name: "Neisseria gonorrhoeae",
    overlapThreshold: 40,
    geneLengths: {
      abgT: 1569,
      group_2700: 813,
      group_3366: 339,
      group_540: 219,
      vapA: 483
    }
  });
  const actual = coreAnalyser.getCore(hits, summaryData);
  const expected = {
    coreSummary: {
      assemblyId: "example",
      speciesId: 485,
      familiesMatched: 4,
      completeAlleles: 4,
      kernelSize: 5,
      percentKernelMatched: 80.0,
      percentAssemblyMatched: 0.1
    },
    coreProfile: {
      id: "example",
      size: 5,
      nt: 2039,
      coreProfile: {
        vapA: {
          alleles: [
            {
              id: "e5c2930616d1778252b1cc0133a92cf2d9c845f8",
              muts: [
                {
                  t: "S",
                  wt: "A",
                  mut: "G",
                  rI: 402,
                  qI: 270474
                }
              ],
              full: true,
              qId: "ERR1549755.17328_4_44.1 Top Hit:WHO_G Neisseria gonorrhoeae WHO G",
              qR: [270073, 270555],
              rR: [1, 483],
              pid: 99.79,
              evalue: 0,
              r: false
            }
          ],
          refLength: 483
        },
        group_2700: {
          alleles: [
            {
              id: "6ec86f685350dabde157dd785cae8ed31fe18bb7",
              muts: [],
              full: true,
              qId: "ERR1549755.17328_4_44.7 Top Hit:WHO_K Neisseria gonorrhoeae WHO K",
              qR: [25576, 26388],
              rR: [1, 813],
              pid: 100,
              evalue: 0,
              r: true
            }
          ],
          refLength: 813
        },
        group_3366: {
          alleles: [
            {
              id: "16297782ec34cdd10d3192d40d19396cf428d01d",
              muts: [
                {
                  t: "S",
                  wt: "T",
                  mut: "C",
                  rI: 135,
                  qI: 101
                },
                {
                  t: "S",
                  wt: "C",
                  mut: "T",
                  rI: 263,
                  qI: 229
                }
              ],
              full: false,
              qId: "ERR1549755.17328_4_44.18 Top Hit:WHO_K Neisseria gonorrhoeae WHO K",
              qR: [1, 305],
              rR: [35, 339],
              pid: 99.34,
              evalue: 2.6681e-156,
              r: false
            }
          ],
          refLength: 339
        },
        group_540: {
          alleles: [
            {
              id: "48a627ec2997b8d3d58291af30006c2699bbea2d",
              muts: [],
              full: true,
              qId: "ERR1549755.17328_4_44.16 Top Hit:WHO_L Neisseria gonorrhoeae WHO L",
              qR: [33105, 33323],
              rR: [1, 219],
              pid: 100,
              evalue: 3.64375e-112,
              r: true
            },
            {
              id: "9b6a20d1f2474588ed5ba9a2b915765eedb69387",
              muts: [
                {
                  t: "S",
                  wt: "T",
                  mut: "C",
                  rI: 6,
                  qI: 3416
                },
                {
                  t: "S",
                  wt: "T",
                  mut: "C",
                  rI: 39,
                  qI: 3449
                },
                {
                  t: "S",
                  wt: "T",
                  mut: "C",
                  rI: 48,
                  qI: 3458
                },
                {
                  t: "S",
                  wt: "G",
                  mut: "A",
                  rI: 51,
                  qI: 3461
                },
                {
                  t: "S",
                  wt: "C",
                  mut: "T",
                  rI: 78,
                  qI: 3488
                },
                {
                  t: "S",
                  wt: "A",
                  mut: "C",
                  rI: 117,
                  qI: 3527
                },
                {
                  t: "S",
                  wt: "G",
                  mut: "A",
                  rI: 132,
                  qI: 3542
                },
                {
                  t: "S",
                  wt: "A",
                  mut: "G",
                  rI: 135,
                  qI: 3545
                },
                {
                  t: "S",
                  wt: "C",
                  mut: "T",
                  rI: 163,
                  qI: 3573
                },
                {
                  t: "S",
                  wt: "A",
                  mut: "G",
                  rI: 179,
                  qI: 3589
                },
                {
                  t: "S",
                  wt: "GC",
                  mut: "TA",
                  rI: 198,
                  qI: 3608
                },
                {
                  t: "S",
                  wt: "C",
                  mut: "T",
                  rI: 212,
                  qI: 3622
                }
              ],
              full: true,
              qId: "ERR1549755.17328_4_44.10 Top Hit:WHO_M Neisseria gonorrhoeae WHO M",
              qR: [3411, 3629],
              rR: [1, 219],
              pid: 94.06,
              evalue: 5.62212e-94,
              r: false
            }
          ],
          refLength: 219
        }
      }
    }
  };
  t.deepEqual(actual, expected);
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
