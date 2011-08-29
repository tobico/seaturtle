#= require ST/Object

ST.module 'Model', ->
  @class 'Index', ->
    @initializer 'withModelAttribute', (model, attribute) ->
      @init()
      @_model = model
      @_attribute = attribute
      @_values = {}
      @_cardinality = 0
  
    @property 'cardinality', 'read'

    @method 'get', (value) ->
      key = String(value)
      unless @_values[key]
        @_values[key] = ST.List.create()
        @_cardinality++
      @_values[key]
  
    @method 'add', (value, item) ->
      @get(value).add item

    @method 'remove', (value, item) ->
      key = String(value)
      if list = @_values[key]
        list.remove item
        if list.isEmpty() && !list.isBound()
          delete @_values[key]
          @_cardinality--