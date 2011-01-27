# Inflector - inflects words between plural and singular
# Based on: http://snippets.dzone.com/posts/show/3388
ST.Inflector = {
  plural: [
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
  ]
  
  singular: [
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
  ]
  
  irregular: {
      move:   'moves'
      foot:   'feet'
      child:  'children'
      man:    'men'
      person: 'people'
  }
  
  uncountable: {
      sheep:1
      fish:1
      series:1
      money:1
      rice:1
      information:1
      equipment:1
  }
  
  makeIrregularInv: ->
    x = {}
    for k of @irregular
      x[@irregular[k]] = k
    @irregularInv = x
  
  translate: (word, uncountable, irregular, regexes) ->
    lower = word.toLowerCase()
    
    return lower if uncountable[lower]
    return irregular[lower] if irregular[lower]
    
    result = null
    for match in regexes
      if match[0].test lower
        result = lower.replace regex, match[1]
        break
        
    result
}

ST.ordinalize = (number, word) ->
  if word
    if number == 1
      '1 ' + word
    else
      number + ' ' + ST.pluralize(word)
  else
    if 11 <= parseInt(number) % 100 && parseInt(number) % 100 <= 13
      number + "th"
    else
      switch parseInt(number) % 10
        when 1 then number + "st"
        when 2 then number + "nd"
        when 3 then number + "rd"
        else number + "th"

ST.pluralize = (word) ->
  i = ST.Inflector
  i.translate word, i.uncountable, i.irregular, i.plural

ST.singularize = (word) ->
  i = ST.Inflector
  i.translate word, i.uncountable, i.irregularInv || i.makeIrregularInv(), i.singular