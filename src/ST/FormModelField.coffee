ST.class 'FormModelField', 'FormField', ->
  @constructor 'withModelSearcher', (model, searcher, labelField) ->
    @init()
    
    @required = false
    @autoField = STAutoField.create()
    @addChild @autoField
    @labelField = labelField || 'label'
    @set {
      model:      model
      searcher:   searcher
      required:   false
      value:      null
    }
  
  @property 'model'
  @property 'searcher'
  @property 'required'
  
  @destructor ->
    @releaseMembers 'autoField'
    @_super()
  
  @method 'load', ->
    @_super()
    
    record = STModel.Index[this.value]
    @autoField.setValue(record && record.get(@labelField))
  
  @method 'setValue', (value, noUpdate) ->
    @_super value
    
    if @loaded && !noUpdate
      record = STModel.Index[value]
      @autoField.setValue(record && record.get(@labelField))
  
  @method 'setLabel', (value) ->
    @label = value
    @autoField.setLabel()
  
  @method 'setModel', (value) ->
    @model = value
    @autoField.setLabel value._name
  
  @method 'setSearcher', (value) ->
    value.retain()
    @autoField.searchers.empty()
    @releaseMembers 'searcher'
    @searcher = value
    @autoField.addSearcher @searcher
  
  @method 'setRequired', (value) ->
    @required = value
    @autoField.setAcceptsNull !value
  
  @method 'autoFieldSelectedResult', (autoField, result) ->
    if result.uuid
      @setValue result.uuid, true
      @autoField.inputElement.val result.textLabel || result.label
      @trigger 'valueChanged', @value
    else if result == null && !@required
      @setValue null, true
      @autoField.inputElement.val ''
      @trigger 'valueChanged', @value
  
  @method 'isValid', ->
    !@required || @value