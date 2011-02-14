ST.class 'Searcher', ->
  
  @constructor ->
    @_super()
    @async = false
    @results = []
  
  @method 'setResults', (results) ->
    @results = results
    @trigger 'resultsUpdated'
  
  @method 'clearResults', ->
    @results = []
    @trigger 'resultsUpdated'
  
  @method 'hilight', (string, term) ->
    if term && term.push
      string.replace(new RegExp(ST.A(term).map(ST.reEscape).join('|'), 'gi'), '<span class="match">$&</span>')
    else if term isnt undefined
      string.replace(new RegExp(ST.reEscape(term), 'gi'), '<span class="match">$&</span>')
    else
      '<span class="match">' + string + '</span>'