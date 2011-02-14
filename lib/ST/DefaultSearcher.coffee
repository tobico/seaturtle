ST.class 'DefaultSearcher', 'Searcher', ->
  @initializer 'withCallback', (callback) ->
    @init()
    @callback = callback
  
  @method 'search', (term) ->
    @setResults [@callback(term)]