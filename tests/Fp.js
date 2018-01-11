const _ = require("lodash");
const { test } = require("ava");
const sinon = require("sinon");

const { Fp } = require("../src/Fp");

test("Add simple reference", t => {
  const fp = new Fp();
  const core = {
    geneA: {
      alleles: [
        {
          rR: [1, 10],
          muts: [
            {
              t: "S",
              mut: "A",
              rI: 10
            }
          ]
        }
      ]
    }
  };
  const expectedSubstitution = {
    geneA: {
      10: {
        A: ["foo"]
      }
    }
  };
  const expectedBounds = {
    foo: {
      geneA: [1, 10]
    }
  };
  fp.addCore("foo", core);
  t.deepEqual(fp.bounds, expectedBounds);
  t.deepEqual(fp.substitutions, expectedSubstitution);
});

test("Fingerprint Size", t => {
  const fp = new Fp();
  fp.substitutions = {
    geneA: {
      10: {
        A: ["refA"]
      }
    }
  };
  t.is(fp.fingerprintSize(), 1);

  fp.substitutions = {
    geneA: {
      10: {
        A: ["refA"],
        AA: ["refA"]
      }
    }
  };
  t.is(fp.fingerprintSize(), 1);

  fp.substitutions = {
    geneA: {
      10: {
        A: ["refA"]
      },
      20: {
        A: ["refA"]
      }
    }
  };
  t.is(fp.fingerprintSize(), 2);

  fp.substitutions = {
    geneA: {
      10: {
        A: ["refA", "refB"],
        AA: ["refA"]
      },
      20: {
        A: ["refA"]
      }
    }
  };
  t.is(fp.fingerprintSize(), 2);

  fp.substitutions = {
    geneA: {
      10: {
        A: ["refA"],
        AA: ["refA"]
      },
      20: {
        A: ["refA"]
      }
    },
    geneB: {
      10: {
        A: ["refA"]
      }
    }
  };
  t.is(fp.fingerprintSize(), 3);
});

test("Add best reference", t => {
  const fp = new Fp();
  const core = {
    geneA: {
      alleles: [
        {
          rR: [1, 10],
          muts: [
            {
              t: "S",
              mut: "A",
              rI: 10
            },
            {
              t: "S",
              mut: "A",
              rI: 9
            }
          ]
        },
        {
          rR: [11, 20],
          muts: [
            {
              t: "S",
              mut: "TTTT",
              rI: 11
            },
            {
              t: "D",
              mut: "-",
              rI: 12
            },
            {
              t: "D",
              mut: "-",
              rI: 13
            }
          ]
        }
      ]
    }
  };
  const expectedSubstitution = {
    geneA: {
      11: {
        TTTT: ["foo"]
      }
    }
  };
  const expectedBounds = {
    foo: {
      geneA: [11, 20]
    }
  };
  fp.addCore("foo", core);
  t.deepEqual(fp.bounds, expectedBounds);
  t.deepEqual(fp.substitutions, expectedSubstitution);
  t.is(fp.fingerprintSize(), 1);
});

test("Add some cores", t => {
  const fp = new Fp({
    geneA: {
      11: {
        TTTT: ["foo"]
      }
    }
  });
  t.is(fp.fingerprintSize(), 1);

  const core = {
    geneB: {
      alleles: [
        {
          rR: [1, 10],
          muts: [
            {
              t: "S",
              mut: "A",
              rI: 8
            }
          ]
        }
      ]
    },
    geneA: {
      alleles: [
        {
          rR: [1, 12],
          muts: [
            {
              t: "S",
              mut: "A",
              rI: 9
            },
            {
              t: "S",
              mut: "TTTT",
              rI: 11
            }
          ]
        }
      ]
    }
  };
  fp.addCore("bar", core);
  t.deepEqual(fp.substitutions, {
    geneA: {
      9: {
        A: ["bar"]
      },
      11: {
        TTTT: ["foo", "bar"]
      }
    },
    geneB: {
      8: {
        A: ["bar"]
      }
    }
  });
  t.is(fp.fingerprintSize(), 3);

  const anotherCore = {
    geneA: {
      alleles: [
        {
          rR: [1, 12],
          muts: [
            {
              t: "S",
              mut: "TT",
              rI: 11
            }
          ]
        }
      ]
    }
  };
  fp.addCore("baz", anotherCore);
  t.deepEqual(fp.substitutions, {
    geneA: {
      9: {
        A: ["bar"]
      },
      11: {
        TTTT: ["foo", "bar"],
        TT: ["baz"]
      }
    },
    geneB: {
      8: {
        A: ["bar"]
      }
    }
  });
  t.is(fp.fingerprintSize(), 3);
});

test("Add more cores", t => {
  const fp = new Fp();
  const rIs = [7, 1, 3, 4, 2, 5, 8, 6];
  _.forEach(rIs, (rI, index) => {
    const core = {
      geneA: {
        alleles: [
          {
            muts: [
              {
                t: "S",
                mut: "A",
                rI
              }
            ]
          }
        ]
      }
    };
    fp.addCore(`ref${index}`, core);
  });
  const expected = {
    geneA: {
      1: {
        A: ["ref1"]
      },
      2: {
        A: ["ref4"]
      },
      3: {
        A: ["ref2"]
      },
      4: {
        A: ["ref3"]
      },
      5: {
        A: ["ref5"]
      },
      6: {
        A: ["ref7"]
      },
      7: {
        A: ["ref0"]
      },
      8: {
        A: ["ref6"]
      }
    }
  };
  t.deepEqual(fp.substitutions, expected);
});

test("Score", t => {
  const referenceFp = new Fp(
    {
      geneA: {
        9: {
          A: ["refB"]
        },
        11: {
          TTTT: ["refA", "refB"],
          TT: ["refD"]
        },
        15: {
          A: ["refA"],
          T: ["refD"]
        },
        100: {
          A: ["refA"]
        }
      },
      geneB: {
        8: {
          A: ["refB"]
        }
      }
    },
    {
      refA: { geneA: [1, 200], geneB: [1, 200] },
      refB: { geneA: [1, 200], geneB: [1, 200] },
      refC: { geneA: [1, 200], geneB: [1, 200] },
      refD: { geneA: [1, 200], geneB: [1, 200] }
    }
  );
  const queryFp = new Fp(
    {
      geneA: {
        9: {
          A: ["query"]
        },
        11: {
          TTTT: ["query"]
        },
        20: {
          T: ["query"]
        }
      },
      geneB: {
        8: {
          T: ["query"]
        }
      },
      geneC: {
        10: {
          T: ["query"]
        }
      }
    },
    {
      query: {
        geneA: [1, 25],
        geneB: [1, 25],
        geneC: [1, 25]
      }
    }
  );
  const scores = referenceFp._score("query", queryFp);
  const expectedScores = [
    {
      score: 0.25,
      referenceId: "refA",
      matchedSites: 1,
      countedSites: 4
    },
    {
      score: 0.75,
      referenceId: "refB",
      matchedSites: 3,
      countedSites: 4
    },
    {
      score: 0.25,
      referenceId: "refC",
      matchedSites: 1,
      countedSites: 4
    },
    {
      score: 0,
      referenceId: "refD",
      matchedSites: 0,
      countedSites: 4
    }
  ];
  t.deepEqual(_.sortBy(scores, "referenceId"), expectedScores);
});

test("Score bounds check", t => {
  const referenceFp = new Fp(
    {
      geneA: {
        1: { // Out of bounds (too early)
          AAAA: ["refA"]
        },
        7: { // Matched
          A: ["refB"]
        },
        8: { // Out of bounds (too long)
          TTTTT: ["refC"]
        },
        10: { // Counted because TT is short enough but no matches
          TTTT: ["refB"],
          TT: ["refA"]
        }
      }
    },
    {
      refA: { geneA: [1, 20] },
      refB: { geneA: [1, 20] },
      refC: { geneA: [8, 20] }
    }
  );
  const queryFp = new Fp(
    {
      geneA: {
        7: {
          A: ["query"]
        },
        10: {
          T: ["query"]
        }
      }
    },
    {
      query: { geneA: [2, 11] }
    }
  );
  const scores = referenceFp._score("query", queryFp);
  const expectedScores = [
    {
      score: 0,
      referenceId: "refA",
      matchedSites: 0,
      countedSites: 2
    },
    {
      score: 0.5,
      referenceId: "refB",
      matchedSites: 1,
      countedSites: 2
    },
    {
      score: 0,
      referenceId: "refC",
      matchedSites: 0,
      countedSites: 1
    }
  ];
  t.deepEqual(_.sortBy(scores, "referenceId"), expectedScores);
});

test("Sort scores", t => {
  const fp = new Fp();
  const scores = [
    {
      score: 0.25,
      referenceId: "refA"
    },
    {
      score: 0.5,
      referenceId: "refC"
    },
    {
      score: 0.5,
      referenceId: "refB"
    },
    {
      score: 0.1,
      referenceId: "refD"
    }
  ];
  const expected = [
    {
      score: 0.5,
      referenceId: "refB"
    },
    {
      score: 0.5,
      referenceId: "refC"
    },
    {
      score: 0.25,
      referenceId: "refA"
    },
    {
      score: 0.1,
      referenceId: "refD"
    }
  ];
  t.deepEqual(fp._sortScores(scores), expected);
});

test("Calculate FP", t => {
  const sandbox = sinon.sandbox.create();

  const core = {};
  const summaryData = {
    assemblyId: "foo",
    speciesId: 1234
  };

  const fakeScores = [
    {
      score: 0.25,
      referenceId: "refA",
      matchedSites: 25,
      countedSites: 100
    },
    {
      score: 0.5,
      referenceId: "refC",
      matchedSites: 50,
      countedSites: 100
    },
    {
      score: 0.5,
      referenceId: "refB",
      matchedSites: 50,
      countedSites: 100
    },
    {
      score: 0.1,
      referenceId: "refD",
      matchedSites: 10,
      countedSites: 100
    }
  ];
  const addCore = sandbox.stub(Fp.prototype, "addCore");
  const _score = sandbox.stub(Fp.prototype, "_score").returns(fakeScores);
  const fingerprintSize = sandbox
    .stub(Fp.prototype, "fingerprintSize")
    .returns(80);

  const referenceFp = new Fp();
  const actual = referenceFp.calculateFp(core, summaryData);
  const expected = {
    assemblyId: "foo",
    speciesId: 1234,
    subTypeAssignment: "refB",
    scores: fakeScores,
    fingerprintSize: 80
  };
  t.deepEqual(actual, expected);
  t.true(addCore.withArgs("foo", core).calledOnce);
  t.true(_score.calledOnce);
  t.true(fingerprintSize.calledOnce);

  sandbox.restore();
});
