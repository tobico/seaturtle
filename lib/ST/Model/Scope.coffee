#require ST/Model
#require ST/Enumerable

ST.Model.class 'Scope', ->
  @include 'Enumerable'
  
  @initializer 'withModel', (model) ->
    @init()
    @_model = model
    @_conditions = []
    @_order = null
  
  @initializer 'withScope', (scope) ->
    @init()
    @_model = scope._model
    @_conditions = []
    for condition in scope._conditions
      @_conditions.push condition
    @_order = scope._order
    
  @method 'fork', (block) ->
    scope = @_class.createWithScope this
    block.call scope if block
    scope
    
  @method 'where', (conditions...) ->
    @fork ->
      for condition in conditions
        @_conditions.push condition
  
  @method 'order', (order) ->
    @fork ->
      @_order = order

  @method 'enableBindings', ->
    for attribute, value of @conditions
      index = @_model.getValueIndex attribute, value
      if index
        index.bind 'itemAdded', this, 'indexItemAdded'
        index.bind 'itemRemoved', this, 'indexItemRemoved'
        index.bind 'itemChanged', this, 'indexItemChanged'
        break
  
  @method 'each', (yield) ->
    self = this
    yield = ST.toProc yield
  
    candidates = null
    for condition in @_conditions
      if condition.index
        return unless condition.index.length
        candidates = condition.index.find condition.value
    
    candidates ||= @_model._byUuid
    matches = []
    
    for uuid of candidates
      if candidates.hasOwnProperty uuid
        candidate = candidates[uuid]
        if candidate.matches @_conditions
          if @_order
            matches.push candidate
          else
            yield candidate
    
    if @_order
      matches.sort (a, b) ->
        a_value = a.get self._order
        b_value = b.get self._order
        if a_value > b_value
          1
        else if a_value < b_value
          -1
        else
          0
      for match in matches
        yield match
  
  @method 'count', ->
    count = 0
    @each (item) ->
      count++
    count
  
  @method 'destroyAll', ->
    @each 'destroy'
  
  @method 'build', (data) ->
    defaults = {}
    for condition in @_conditions
      if condition.attribute && condition.value
        defaults[condition.attribute] = condition.value
    $.extend(defaults, data) if data
    @_model.createWithData defaults
  
  @method 'indexItemAdded', (index, item) ->
    if item.matches @_conditions
      @trigger 'itemAdded', item

  @method 'indexItemRemoved', (index, item) ->  
    if item.destroyed || !item.matches(@_conditions)
      @trigger 'itemRemoved', item
  
  @method 'indexItemChanged', (index, item) ->
    if item.matches @_conditions
      @trigger 'itemChanged', item