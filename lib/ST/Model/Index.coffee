#require ST/Model

ST.Model.class 'Index', ->
  @initializer 'withModelAttribute', (model, attribute) ->
    @_model = model
    @_attribute = attribute
    @_byValue = {}
  
  @property 'model'
  @property 'attribute'
  
  @method 'id', ->
    @_model._name + '#' + @_attribute
  
  @method 'modelCreated', (model) ->
    value = model[@_attribute]()
    objects = @_byValue[value] ||= []
    objects.push model
  
  @method 'modelDestroyed', (model) ->
    value = model[@_attribute]()
    objects = @_byValue[value]
    if objects
      objects.splice index, 1 while (index = objects.indexOf model) >= 0