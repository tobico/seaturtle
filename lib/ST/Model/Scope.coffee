#require ST/Model
#require ST/Enumerable

ST.Model.class 'Scope', 'List', ->
  @initializer 'withModel', (model) ->
    @init()
    @_model = model
    @_conditions = []
    @_order = null
    @_populated = false
  
  @initializer 'withScope', (scope) ->
    @init()
    @_model = scope._model
    @_conditions = []
    for condition in scope._conditions
      @_conditions.push condition
    @_order = scope._order
    @_populated = false
  
  @property 'model', 'read'
  
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
    target.bind 'itemAdded',   this, 'targetItemAdded'
    target.bind 'itemRemoved', this, 'targetItemRemoved'
    @_bindingsAdded = true
  
  @method 'removeBindings', ->
    @bindTarget().unbindAll(this)
    @_bindingsAdded = false
  
  @method 'bind', (trigger, receiver, selector) ->
    @populate()
    @addBindings() unless @_bindingsAdded
    @super trigger, receiver, selector
  
  @method 'unbindAll', (receiver) ->
    @super receiver
    @removeBindings() if @_bindingsAdded && !@isBound()

  @method 'each', (yield) ->
    @populate()
    @super yield

  @method 'count', ->
    @populate()
    @super()
  
  @method 'populate', ->
    unless @_populated
      candidates = @_model._byUuid
      cardinality = 1
      for condition in @_conditions
        if condition.index && condition.index.cardinality() > cardinality
          candidates = condition.index.find condition.value
          cardinality = condition.index.cardinality()        
      
      for uuid of candidates
        if candidates.hasOwnProperty uuid
          candidate = candidates[uuid]
          if candidate.matches @_conditions
            @add candidate

      if @_order
        order = @_order
        @_array.sort (a, b) ->
          a_value = a.get order
          b_value = b.get order
          if a_value > b_value
            1
          else if a_value < b_value
            -1
          else
            0
      @_populated = true
  
  @method 'destroyAll', ->
    @each 'destroy'
  
  @method 'build', (data) ->
    defaults = {}
    for condition in @_conditions
      if condition.attribute && condition.value
        defaults[condition.attribute] = condition.value
    $.extend(defaults, data) if data
    @_model.createWithData defaults
  
  @method 'search', (keywords, limit) ->
    @_model.search keywords, limit, @_conditions
  
  @method 'targetItemAdded', (target, item) ->
    @add item if item.matches @_conditions

  @method 'targetItemRemoved', (target, item) ->  
    @remove item