ST.class 'AjaxSearcher', 'Searcher', ->

  @constructor 'withUrl', (url, callback) ->
    @init()
    
    @url = url
    @callback = callback
    @async = true
    @split = true
    @minLength = 3
    @cache = {}
    
  @property 'minLength'
  
  @method 'search', (term) ->
    self = this
    
    @searching = true
    
    if term.length < @minLength
      @clearResults()
    else if @cache[term]
      @setResults @cache[term]
    else 
      $.ajax {
          url:      @url
          method:   'get'
          dataType: 'json'
          data:     {q: term}
          success:  (data) -> self.succeeded term, data
          error:    @methodFn 'failed'
      }
  
  @method 'succeeded', (term, data) ->
    self = this;
    
    results = []
    if data && data.length
      for row in data
        if @callback
          results.push @callback(row, (text) ->
            term = term.split ' ' if self.split
            self.hilight text, term
          )
        else
          results.push row
    @cache[term] = results
    @setResults results
  
  @method 'failed', ->
    @setResults []
