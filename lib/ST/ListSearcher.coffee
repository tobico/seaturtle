ST.class 'ListSearcher', 'Searcher', ->
  @constructor 'withList', (list, callback) ->
    @init()
    @setList list
    @callback = callback
    @buildIndex()
    
  @property 'list'
  @property 'needsRebuild'
  
  @method 'setList', (newList) ->
    @list.unbindAll this if @list
    @list = newList
    if @list
      @list.bind 'itemAdded', this, 'itemAdded'
      @list.bind 'itemRemoved', this, 'itemRemoved'
  
  @method 'buildIndex', ->
    self = this
    @needsRebuild = false
    @itemsByLabel = {}
    
    index = []
    collection.each (item) ->
      label = @callback item
      index.push label
      self.itemsByLabel[label] = item
    @indexString = ':' + index.join(':') + ':'
  
  @method 'search', (term) ->
    @buildIndex() if @needsRebuild
    
    exp = new RegExp ':([^:]*?' + ST.reEscape(term) + '[^:]*)', 'gi'
    match = null
    results = []
    while (match = exp.exec(@indexString)) != null
      results.push @callback(@itemsByLabel[match[1]])
    @setResults results
  
  @method 'itemAdded', (list, item) ->
    @needsRebuild = true
  
  @method 'itemRemoved', (list, item) ->
    @needsRebuild = true