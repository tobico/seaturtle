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
    @_model = scope.model()
    @_conditions = []
    for condition in scope.conditions()
      @_conditions.push condition
    @_order = scope.order()
  
  @property 'model'
  @property 'conditions'
  @property 'order'
  
  @method 'fork', (block) ->
    scope = @_class.createWithScope this
    block.call scope
    
  @method 'where', (conditions...) ->
    @fork ->
      for condition in conditions
        @conditions().push condition
  
  @method 'order', (order) ->
    @fork ->
      @order order

  @method 'enableBindings', ->
    for attribute, value of @conditions
      index = @_model.getValueIndex attribute, value
      if index
        index.bind 'itemAdded', this, 'indexItemAdded'
        index.bind 'itemRemoved', this, 'indexItemRemoved'
        index.bind 'itemChanged', this, 'indexItemChanged'
        break
  
  @method 'each', (yield) ->  
    candidates = null
    for condition in @conditions
      if condition.index
        return unless condition.index.length
        candidates = condition.index.find condition.value
    
    candidates = @_model.array()
    
    for candidate in candidates
      yield candidate if @matches candidate
  
  @method 'count', ->
    count = 0
    @each (item) ->
      count++
    count
  
  @method 'destroyAll', ->
    @each 'destroy'
  
  @method 'build', (data) ->
    data = $.extend {}, @conditions, data
    @model.createWithData data
  
  @method 'indexItemAdded', (index, item) ->
    if item.matches @condition
      @trigger 'itemAdded', item

  @method 'indexItemRemoved', (index, item) ->  
    if item.destroyed || !item.matches(@conditions)
      @trigger 'itemRemoved', item
  
  @method 'indexItemChanged', (index, item) ->
    if item.matches @conditions
      @trigger 'itemChanged', item