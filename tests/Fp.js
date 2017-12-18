const _ = require("lodash");
const { test } = require("ava");

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
        A: new Set(["foo"])
      }
    }
  };
  const expectedBounds = {
    geneA: [1, 10]
  };
  const bounds = fp.addCore("foo", core);
  t.deepEqual(bounds, expectedBounds);
  t.deepEqual(fp.substitutions, expectedSubstitution);
  t.is(fp.fingerprintSize(), 1);
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
        TTTT: new Set(["foo"])
      }
    }
  };
  const expectedBounds = {
    geneA: [11, 20]
  };
  const bounds = fp.addCore("foo", core);
  t.deepEqual(bounds, expectedBounds);
  t.deepEqual(fp.substitutions, expectedSubstitution);
  t.is(fp.fingerprintSize(), 1);
});

test("Update profile", t => {
  const fp = new Fp({
    geneA: {
      11: {
        TTTT: new Set(["foo"])
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
        A: new Set(["bar"])
      },
      11: {
        TTTT: new Set(["foo", "bar"])
      }
    },
    geneB: {
      8: {
        A: new Set(["bar"])
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
        A: new Set(["bar"])
      },
      11: {
        TTTT: new Set(["foo", "bar"]),
        TT: new Set(["baz"])
      }
    },
    geneB: {
      8: {
        A: new Set(["bar"])
      }
    }
  });

  t.is(fp.fingerprintSize(), 3);
});

test("Get Profile", t => {
  const fp = new Fp({
    geneA: {
      9: {
        A: new Set(["bar"])
      },
      11: {
        TTTT: new Set(["foo", "bar"]),
        TT: new Set(["baz"])
      }
    },
    geneB: {
      8: {
        A: new Set(["bar"])
      }
    }
  });

  const expected = {
    geneA: [
      {
        rI: 9,
        muts: {
          A: ["bar"]
        }
      },
      {
        rI: 11,
        muts: {
          TTTT: ["foo", "bar"],
          TT: ["baz"]
        }
      }
    ],
    geneB: [
      {
        rI: 8,
        muts: {
          A: ["bar"]
        }
      }
    ]
  };

  t.deepEqual(fp.getProfile(), expected);
});

test("Get Profile", t => {
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
    geneA: [
      {
        rI: 1,
        muts: {
          A: ["ref1"]
        }
      },
      {
        rI: 2,
        muts: {
          A: ["ref4"]
        }
      },
      {
        rI: 3,
        muts: {
          A: ["ref2"]
        }
      },
      {
        rI: 4,
        muts: {
          A: ["ref3"]
        }
      },
      {
        rI: 5,
        muts: {
          A: ["ref5"]
        }
      },
      {
        rI: 6,
        muts: {
          A: ["ref7"]
        }
      },
      {
        rI: 7,
        muts: {
          A: ["ref0"]
        }
      },
      {
        rI: 8,
        muts: {
          A: ["ref6"]
        }
      }
    ]
  };
  t.deepEqual(fp.getProfile(), expected);
});

// test("Compare", t => {
//   const referenceProfile = {
//     geneA: [
//       {
//         rI: 9,
//         muts: {
//           A: ["refB"]
//         }
//       },
//       {
//         rI: 11,
//         muts: {
//           TTTT: ["refA", "refB"],
//           TT: ["refC"]
//         }
//       }
//     ],
//     geneB: [
//       {
//         rI: 8,
//         muts: {
//           A: ["refB"]
//         }
//       }
//     ]
//   };
//   const fp = new Fp({
//     geneA: {

//     }
//   })
//   const fp = new Fp({
//     geneA: {
//       9: {
//         A: new Set(["bar"])
//       },
//       11: {
//         TTTT: new Set(["foo", "bar"]),
//         TT: new Set(["baz"])
//       }
//     },
//     geneB: {
//       8: {
//         A: new Set(["bar"])
//       }
//     }
//   });
// })
