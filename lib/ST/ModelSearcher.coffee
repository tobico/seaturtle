ST.class 'ModelSearcher', 'Searcher', ->
  @constructor 'withModelUrl', (model, url, labelField) ->
    @init()
    
    @model = model
    @url = url
    @labelField = labelField || 'label'
    @async = true
    @split = true
    @minLength = 3
    @cacheMinutes = 2
    @cache = {}
    window.c = @cache
  
  @property 'minLength'
  
  @method 'search', (term) ->
    self = this
    
    @searching = true
    
    # Convert term to lowercase to compare
    lcTerm = term.toLowerCase()
    
    # Expire cache
    now = new Date
    delete @cache[lcTerm] if @cache[lcTerm] && @cache[lcTerm].expires <= now
    
    if term.length < @minLength
      @clearResults()
    else if @cache[lcTerm]
      @setResults @cache[lcTerm].results
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
    self = this
    
    results = []
    if data && data.length
      for row in data
        # Load model data
        ST.Model.createWithData row, {temporary: true}
        
        # Don't add object to results list if it's for another model
        return if row._model != @model._name
        
        row.model = ST.Model.Index[row.uuid]
        row.label = row.model.get @labelField
        
        results.push row
    
    # Save result in cache
    @cache[term.toLowerCase()] = {
        results: results
        expires: @cacheMinutes.minutes().fromNow()
    };
    
    @setResults results
  
  @method 'failed', ->
    @setResults []