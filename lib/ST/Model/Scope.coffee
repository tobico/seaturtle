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
  
  @method 'bindTarget', ->
    unless @_bindTarget
      @_bindTarget = @_model
      for condition in @_conditions
        if condition.type == 'equals' && @_model._indexes && @_model._indexes[condition.attribute]
          @_bindTarget = @_model._indexes[condition.attribute].get condition.value
    @_bindTarget

  @method 'addBindings', ->
    target = @bindTarget()
    target.bind 'itemAdded',   this, 'itemAdded'
    target.bind 'itemRemoved', this, 'itemRemoved'
    target.bind 'itemChanged', this, 'itemChanged'
    @_bindingsAdded = true
  
  @method 'removeBindings', ->
    @bindTarget().unbindAll(this)
    @_bindingsAdded = false
  
  @method 'bind', (trigger, receiver, selector) ->
    @addBindings() unless @_bindingsAdded
    @super trigger, receiver, selector
  
  @method 'unbindAll', (receiver) ->
    @super receiver
    @removeBindings() if @_bindingsAdded && !@isBound()
  
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
  
  @method 'itemAdded', (index, item) ->
    @trigger 'itemAdded', item if item.matches @_conditions

  @method 'itemRemoved', (index, item) ->  
    @trigger 'itemRemoved', item if item.destroyed || !item.matches(@_conditions)
  
  @method 'itemChanged', (index, item) ->
    @trigger 'itemChanged', item if item.matches @_conditions