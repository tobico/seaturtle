// Inflector - inflects words between plural and singular
// Based on: http://snippets.dzone.com/posts/show/3388
export const Inflector = {
  plural: [
    [/(quiz)$/i,                 "$1zes"     ],
    [/^(ox)$/i,                  "$1en"      ],
    [/([m|l])ouse$/i,            "$1ice"     ],
    [/(matr|vert|ind)ix|ex$/i,   "$1ices"    ],
    [/(x|ch|ss|sh)$/i,           "$1es"      ],
    [/([^aeiouy]|qu)y$/i,        "$1ies"     ],
    [/(hive)$/i,                 "$1s"       ],
    [/(?:([^f])fe|([lr])f)$/i,   "$1$2ves"   ],
    [/sis$/i,                    "ses"       ],
    [/([ti])um$/i,               "$1a"       ],
    [/(buffal|tomat)o$/i,        "$1oes"     ],
    [/(bu)s$/i,                  "$1ses"     ],
    [/(alias|status)$/i,         "$1es"      ],
    [/(octop|vir)us$/i,          "$1i"       ],
    [/(ax|test)is$/i,            "$1es"      ],
    [/s$/i,                      "s"         ],
    [/$/i,                       "s"         ]
  ],
  
  singular: [
    [/(quiz)zes$/i,                                      "$1"        ],
    [/(matr)ices$/i,                                     "$1ix"      ],
    [/(vert|ind)ices$/i,                                 "$1ex"      ],
    [/^(ox)en/i,                                         "$1"        ],
    [/(alias|status)es$/i,                               "$1"        ],
    [/(octop|vir)i$/i,                                   "$1us"      ],
    [/(cris|ax|test)es$/i,                               "$1is"      ],
    [/(shoe)s$/i,                                        "$1"        ],
    [/(o)es$/i,                                          "$1"        ],
    [/(bus)es$/i,                                        "$1"        ],
    [/([m|l])ice$/i,                                     "$1ouse"    ],
    [/(x|ch|ss|sh)es$/i,                                 "$1"        ],
    [/(m)ovies$/i,                                       "$1ovie"    ],
    [/(s)eries$/i,                                       "$1eries"   ],
    [/([^aeiouy]|qu)ies$/i,                              "$1y"       ],
    [/([lr])ves$/i,                                      "$1f"       ],
    [/(tive)s$/i,                                        "$1"        ],
    [/(hive)s$/i,                                        "$1"        ],
    [/([^f])ves$/i,                                      "$1fe"      ],
    [/(^analy)ses$/i,                                    "$1sis"     ],
    [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis"],
    [/([ti])a$/i,                                        "$1um"      ],
    [/(n)ews$/i,                                         "$1ews"     ],
    [/s$/i,                                              ""          ]
  ],
  
  irregular: {
      move:   'moves',
      foot:   'feet',
      child:  'children',
      man:    'men',
      person: 'people'
  },
  
  uncountable: {
      sheep:1,
      fish:1,
      series:1,
      money:1,
      rice:1,
      information:1,
      equipment:1
  },
  
  makeIrregularInv() {
    const x = {};
    for (let k in this.irregular) {
      x[this.irregular[k]] = k;
    }
    return this.irregularInv = x;
  },
  
  translate(word, uncountable, irregular, regexes) {
    const lower = word.toLowerCase();
    
    if (uncountable[lower]) { return lower; }
    if (irregular[lower]) { return irregular[lower]; }
    
    let result = null;
    for (let match of Array.from(regexes)) {
      if (match[0].test(lower)) {
        result = word.replace(match[0], match[1]);
        break;
      }
    }
        
    return result;
  }
};
