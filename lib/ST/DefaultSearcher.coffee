ST.class 'DefaultSearcher', 'Searcher' ->
  @constructor 'withCallback', (callback) ->
    @init()
    @callback = callback
  
  @method 'search', (term) ->
    @setResults [@callback(term)]