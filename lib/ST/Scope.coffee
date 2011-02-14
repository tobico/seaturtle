ST.class 'Scope', ->
  @include 'Enumerable'
  
  @constructor (model, options={}) ->
    @_super()
    @model = model
    @conditions = options.conditions || {}
    
  @method 'where', (conditions={}) ->
    $.create @model, {
      conditions: $.extend {}, @conditions, conditions
    }

  @method 'enableBindings', ->
    for attribute, value of @conditions ->
      index = @model.getValueIndex attribute, value
      if index
        index.bind 'itemAdded', this, 'indexItemAdded'
        index.bind 'itemRemoved', this, 'indexItemRemoved'
        index.bind 'itemChanged', this, 'indexItemChanged'
        break
  
  @method 'each', ->
    # something here
    
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
    if item.matches(@condition) ->
      @trigger 'itemAdded', item

  @method 'indexItemRemoved', (index, item) ->  
    if item.destroyed || !item.matches(@conditions)
      @trigger 'itemRemoved', item
  
  @method 'indexItemChanged', (index, item) ->
    if item.matches(@conditions)
      @trigger 'itemChanged', item