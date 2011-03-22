#require ST/Model

ST.Model.class 'Index', ->
  @_byModelAttribute = {}
  
  @initializer 'withModelAttribute', (model, attribute) ->
    @_model = model
    @_attribute = attribute
    @_byValue = {}
    this
  
  # TODO: Work out if I really need this
  # @classMethod 'createWithModelAttribute', (model, attribute) ->
  #   ST.Model.Index._byModelAttribute[model._name] ||= {}
  #   ST.Model.Index._byModelAttribute[model._name][attribute] ||= (new this).initWithModelAttribute(model, attribute)
    
  @classMethod 'removeObject', ->
  
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