/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `web/idl/defighter.json`.
 */
export type Defighter = {
  "address": "HGkRbNawHR3PbA2h1LgqtMNCj6jcrS14c86wDUvS3dTL",
  "metadata": {
    "name": "defighter",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "adminUpdateConfig",
      "discriminator": [
        224,
        243,
        100,
        135,
        120,
        165,
        43,
        244
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "newConfig",
          "type": {
            "defined": {
              "name": "balanceConfig"
            }
          }
        }
      ]
    },
    {
      "name": "commitMove",
      "discriminator": [
        27,
        16,
        69,
        212,
        175,
        110,
        123,
        189
      ],
      "accounts": [
        {
          "name": "battle",
          "writable": true
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "createPlayer",
      "discriminator": [
        19,
        178,
        189,
        216,
        159,
        134,
        0,
        192
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "class",
          "type": {
            "defined": {
              "name": "fighterClass"
            }
          }
        }
      ]
    },
    {
      "name": "initConfig",
      "discriminator": [
        23,
        235,
        115,
        232,
        168,
        96,
        1,
        231
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "base",
          "type": "i32"
        },
        {
          "name": "linearA",
          "type": "i32"
        },
        {
          "name": "dimK",
          "type": "i32"
        },
        {
          "name": "dimT",
          "type": "i32"
        },
        {
          "name": "maxLevel",
          "type": "u16"
        },
        {
          "name": "tieBreakRand",
          "type": "bool"
        },
        {
          "name": "useDimBonus",
          "type": "bool"
        },
        {
          "name": "xpBase",
          "type": "u64"
        },
        {
          "name": "xpTieBps",
          "type": "u16"
        },
        {
          "name": "xpLoserBps",
          "type": "u16"
        },
        {
          "name": "upgradeC0",
          "type": "u64"
        },
        {
          "name": "upgradePBps",
          "type": "u16"
        },
        {
          "name": "rpsWinBase",
          "type": "i32"
        },
        {
          "name": "rpsTieBase",
          "type": "i32"
        }
      ]
    },
    {
      "name": "initiateBattle",
      "discriminator": [
        248,
        205,
        226,
        209,
        41,
        28,
        54,
        75
      ],
      "accounts": [
        {
          "name": "battle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "challenger"
              },
              {
                "kind": "arg",
                "path": "opponent"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "challenger",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "opponent",
          "type": "pubkey"
        },
        {
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "commitDeadlineSlots",
          "type": "u64"
        },
        {
          "name": "revealDeadlineSlots",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resolveBattle",
      "discriminator": [
        112,
        191,
        142,
        62,
        126,
        119,
        170,
        54
      ],
      "accounts": [
        {
          "name": "battle",
          "writable": true
        },
        {
          "name": "playerChallenger",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "battle.challenger",
                "account": "battle"
              }
            ]
          }
        },
        {
          "name": "playerOpponent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "battle.opponent",
                "account": "battle"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "revealMove",
      "discriminator": [
        30,
        133,
        198,
        26,
        106,
        44,
        55,
        149
      ],
      "accounts": [
        {
          "name": "battle",
          "writable": true
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "playerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "moveChoice",
          "type": {
            "defined": {
              "name": "moveChoice"
            }
          }
        },
        {
          "name": "salt",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "upgradeAbility",
      "discriminator": [
        52,
        72,
        69,
        210,
        102,
        128,
        130,
        170
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "player"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "abilityIndex",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "balanceConfig",
      "discriminator": [
        136,
        224,
        146,
        63,
        217,
        120,
        138,
        131
      ]
    },
    {
      "name": "battle",
      "discriminator": [
        81,
        148,
        121,
        71,
        63,
        166,
        116,
        24
      ]
    },
    {
      "name": "player",
      "discriminator": [
        205,
        222,
        112,
        7,
        165,
        155,
        206,
        218
      ]
    }
  ],
  "events": [
    {
      "name": "abilityUpgraded",
      "discriminator": [
        34,
        32,
        163,
        18,
        255,
        105,
        16,
        106
      ]
    },
    {
      "name": "battleInitiated",
      "discriminator": [
        143,
        241,
        154,
        163,
        133,
        237,
        42,
        247
      ]
    },
    {
      "name": "battleResolved",
      "discriminator": [
        47,
        156,
        226,
        94,
        163,
        176,
        162,
        241
      ]
    },
    {
      "name": "moveCommitted",
      "discriminator": [
        236,
        104,
        12,
        242,
        153,
        135,
        13,
        77
      ]
    },
    {
      "name": "moveRevealed",
      "discriminator": [
        29,
        51,
        92,
        150,
        197,
        49,
        35,
        89
      ]
    },
    {
      "name": "xpAwarded",
      "discriminator": [
        166,
        104,
        173,
        241,
        191,
        126,
        144,
        63
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notEnoughXp",
      "msg": "Not enough XP to upgrade"
    },
    {
      "code": 6001,
      "name": "invalidAbility",
      "msg": "Invalid ability index"
    },
    {
      "code": 6002,
      "name": "notInBattle",
      "msg": "Player not in this battle"
    },
    {
      "code": 6003,
      "name": "invalidReveal",
      "msg": "Reveal does not match commitment"
    },
    {
      "code": 6004,
      "name": "alreadyCommitted",
      "msg": "Already committed"
    },
    {
      "code": 6005,
      "name": "alreadyRevealed",
      "msg": "Already revealed"
    },
    {
      "code": 6006,
      "name": "deadlinePassed",
      "msg": "Commit deadline passed"
    },
    {
      "code": 6007,
      "name": "revealDeadlinePassed",
      "msg": "Reveal deadline passed"
    },
    {
      "code": 6008,
      "name": "notReadyToResolve",
      "msg": "Too early to resolve"
    },
    {
      "code": 6009,
      "name": "alreadyResolved",
      "msg": "Battle already resolved"
    },
    {
      "code": 6010,
      "name": "notConfigured",
      "msg": "Config not found"
    },
    {
      "code": 6011,
      "name": "maxLevel",
      "msg": "Ability exceeds max level"
    },
    {
      "code": 6012,
      "name": "invalidClassMove",
      "msg": "Move does not match player class"
    }
  ],
  "types": [
    {
      "name": "abilityUpgraded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "abilityIndex",
            "type": "u8"
          },
          {
            "name": "newLevel",
            "type": "u16"
          },
          {
            "name": "cost",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "balanceConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "base",
            "type": "i32"
          },
          {
            "name": "linearA",
            "type": "i32"
          },
          {
            "name": "dimK",
            "type": "i32"
          },
          {
            "name": "dimT",
            "type": "i32"
          },
          {
            "name": "maxLevel",
            "type": "u16"
          },
          {
            "name": "tieBreakRand",
            "type": "bool"
          },
          {
            "name": "useDimBonus",
            "type": "bool"
          },
          {
            "name": "xpBase",
            "type": "u64"
          },
          {
            "name": "xpTieBps",
            "type": "u16"
          },
          {
            "name": "xpLoserBps",
            "type": "u16"
          },
          {
            "name": "upgradeC0",
            "type": "u64"
          },
          {
            "name": "upgradePBps",
            "type": "u16"
          },
          {
            "name": "rpsWinBase",
            "type": "i32"
          },
          {
            "name": "rpsTieBase",
            "type": "i32"
          }
        ]
      }
    },
    {
      "name": "battle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "challenger",
            "type": "pubkey"
          },
          {
            "name": "opponent",
            "type": "pubkey"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "battleState"
              }
            }
          },
          {
            "name": "createdSlot",
            "type": "u64"
          },
          {
            "name": "commitDeadlineSlot",
            "type": "u64"
          },
          {
            "name": "revealDeadlineSlot",
            "type": "u64"
          },
          {
            "name": "commitChallenger",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "commitOpponent",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "revealChallenger",
            "type": {
              "option": {
                "defined": {
                  "name": "moveChoice"
                }
              }
            }
          },
          {
            "name": "revealOpponent",
            "type": {
              "option": {
                "defined": {
                  "name": "moveChoice"
                }
              }
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "battleInitiated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "battle",
            "type": "pubkey"
          },
          {
            "name": "challenger",
            "type": "pubkey"
          },
          {
            "name": "opponent",
            "type": "pubkey"
          },
          {
            "name": "commitDeadlineSlot",
            "type": "u64"
          },
          {
            "name": "revealDeadlineSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "battleResolved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "battle",
            "type": "pubkey"
          },
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "challengerScore",
            "type": "i32"
          },
          {
            "name": "opponentScore",
            "type": "i32"
          }
        ]
      }
    },
    {
      "name": "battleState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "waitingForCommits"
          },
          {
            "name": "waitingForReveals"
          },
          {
            "name": "resolved"
          }
        ]
      }
    },
    {
      "name": "fighterClass",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "shitposter"
          },
          {
            "name": "builder"
          },
          {
            "name": "vc"
          }
        ]
      }
    },
    {
      "name": "moveChoice",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "memeBomb"
          },
          {
            "name": "copypastaStorm"
          },
          {
            "name": "shipIt"
          },
          {
            "name": "testnetDeploy"
          },
          {
            "name": "seriesACannon"
          },
          {
            "name": "dueDiligenceDelay"
          }
        ]
      }
    },
    {
      "name": "moveCommitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "battle",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "moveRevealed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "battle",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "moveChoice",
            "type": {
              "defined": {
                "name": "moveChoice"
              }
            }
          }
        ]
      }
    },
    {
      "name": "player",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "class",
            "type": {
              "defined": {
                "name": "fighterClass"
              }
            }
          },
          {
            "name": "xp",
            "type": "u64"
          },
          {
            "name": "abilities",
            "type": {
              "array": [
                "u16",
                3
              ]
            }
          },
          {
            "name": "elo",
            "type": "i32"
          },
          {
            "name": "version",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "xpAwarded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "delta",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
