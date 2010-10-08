//Inflector - inflects words between plural and singular
//Based on: http://snippets.dzone.com/posts/show/3388
ST.Inflector = {
    plural: new STArray(
        [/(quiz)$/,                 "$1zes"     ],
        [/^(ox)$/,                  "$1en"      ],
        [/([m|l])ouse$/,            "$1ice"     ],
        [/(matr|vert|ind)ix|ex$/,   "$1ices"    ],
        [/(x|ch|ss|sh)$/,           "$1es"      ],
        [/([^aeiouy]|qu)y$/,        "$1ies"     ],
        [/(hive)$/,                 "$1s"       ],
        [/(?:([^f])fe|([lr])f)$/,   "$1$2ves"   ],
        [/sis$/,                    "ses"       ],
        [/([ti])um$/,               "$1a"       ],
        [/(buffal|tomat)o$/,        "$1oes"     ],
        [/(bu)s$/,                  "$1ses"     ],
        [/(alias|status)$/,         "$1es"      ],
        [/(octop|vir)us$/,          "$1i"       ],
        [/(ax|test)is$/,            "$1es"      ],
        [/s$/,                      "s"         ],
        [/$/,                       "s"         ]
    ),
    
    singular: new STArray(
        [/(quiz)zes$/,                                      "$1"        ],
        [/(matr)ices$/,                                     "$1ix"      ],
        [/(vert|ind)ices$/,                                 "$1ex"      ],
        [/^(ox)en/,                                         "$1"        ],
        [/(alias|status)es$/,                               "$1"        ],
        [/(octop|vir)i$/,                                   "$1us"      ],
        [/(cris|ax|test)es$/,                               "$1is"      ],
        [/(shoe)s$/,                                        "$1"        ],
        [/(o)es$/,                                          "$1"        ],
        [/(bus)es$/,                                        "$1"        ],
        [/([m|l])ice$/,                                     "$1ouse"    ],
        [/(x|ch|ss|sh)es$/,                                 "$1"        ],
        [/(m)ovies$/,                                       "$1ovie"    ],
        [/(s)eries$/,                                       "$1eries"   ],
        [/([^aeiouy]|qu)ies$/,                              "$1y"       ],
        [/([lr])ves$/,                                      "$1f"       ],
        [/(tive)s$/,                                        "$1"        ],
        [/(hive)s$/,                                        "$1"        ],
        [/([^f])ves$/,                                      "$1fe"      ],
        [/(^analy)ses$/,                                    "$1sis"     ],
        [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/, "$1$2sis"],
        [/([ti])a$/,                                        "$1um"      ],
        [/(n)ews$/,                                         "$1ews"     ],
        [/s$/,                                              ""          ]
    ),
    
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
    
    makeIrregularInv: function()
    {
        var x = {};
        for (var k in this.irregular) {
            x[this.irregular[k]] = k;
        }
        return this.irregularInv = x;
    },
    
    translate: function(word, uncountable, irregular, regexes)
    {
        var lower = word.toLowerCase();
        
        if (uncountable[lower]) return lower;
        if (irregular[lower]) return irregular[lower];
        
        var result = null;
        regexes.each(function(a) {
            var regex = a[0], string = a[1];
            if (regex.test(lower)) {
                result = lower.replace(regex, string);
                return 'break';
            }
        });
        return result;
    }
};

ST.ordinalize = function(number, word)
{
    if (word) {
        if (number == 1) return '1 ' + word;
        else return number + ' ' + ST.pluralize(word);
    } else {
        if (11 <= parseInt(number) % 100 && parseInt(number) % 100 <= 13) {
            return number + "th";
        } else {
            switch (parseInt(number) % 10) {
                case  1: return number + "st";
                case  2: return number + "nd";
                case  3: return number + "rd";
                default: return number + "th";
            }
        }
    }
};

ST.pluralize = function(word)
{
    var i = ST.Inflector;
    
    return i.translate(
        word,
        i.uncountable,
        i.irregular,
        i.plural
    );
};

ST.singularize = function(word)
{
    var i = ST.Inflector;
    
    return i.translate(
        word,
        i.uncountable,
        i.irregularInv || i.makeIrregularInv(),
        i.singular
    );
};