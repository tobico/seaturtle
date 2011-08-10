#require ST/View
#require ST/TextFieldView
#require ST/ModelFieldView

ST.class 'FormView', 'View', ->
  @initializer (options, definition) ->
    self = this
    
    @super()
    
    @_command   = options.command || 'Save Form'
    @_defaults  = options.defaults || null
    @_fields    = ST.List.create()
    
    if options.scope
      @_scope = options.scope
      @_model = options.scope.model()
    else if options.item
      @_item  = options.item
      @_model = options.item._class
    else
      @_model   = options.model
    
    dsl = {
      _add: (field, attribute) ->
        field.id attribute
        field.bind 'submit', self
        self._fields.add field
        field.release()        
      text: (attribute) ->
        @_add ST.TextFieldView.create(), attribute
      enum: (attribute, details) ->
        details ||= self.detailsFor attribute
        @_add ST.EnumFieldView.createWithValuesNull(details.values, details.null), attribute
      model: (attribute) ->
        details = self.detailsFor attribute
        field = ST.ModelFieldView.createWithModel self._model._namespace.class(details.model)
        field.searchRemotelyAt details.searchesRemotelyAt if details.searchesRemotelyAt
        @_add field, attribute
    }
    definition.call dsl
    @loadFieldValues()

  @property 'defaults'
  @property 'model'
  @property 'item'
  @property 'command'
  
  @destructor ->
    @_fields.empty()
    @super()
  
  @method 'loadFieldValues', ->
    self = this
    @_fields.each (field) ->
      attribute = field.id()
      field.value(
        if self._item
          self._item[attribute]()
        else if self._defaults && self._defaults[attribute]
          self._defaults[attribute]
        else if details = self.detailsFor(attribute)
          details.default
      )
  
  @method 'detailsFor', (attribute) ->
    @_model._attributes[attribute]
  
  @method 'generateTableHTML', ->
    self = this
    html = ['<table class="formView">']
    @_fields.each (field) ->
      attribute = field.id()
      html.push '<tr><th class="label"><label for="', attribute, '">',
        self._model.labelForAttribute(attribute),
        ':</label></th><td class="field" id="cell_for_', attribute,
        '"></td></tr>'
    html.push '</table>'
    html.join ''
  
  @method 'render', ->
    self = this
    @_element.html @generateTableHTML()
    
    @_fields.each (field) ->
      cell = $ "#cell_for_#{field.id()}", self._element
      field.load()
      cell.append field.element()
  
  @method 'data', ->
    data = {}
    
    # Copy default values into data
    for attribute of @_defaults
      if @_defaults.hasOwnProperty attribute
        data[attribute] = @_defaults[attribute]
    
    # Read field values into data
    @_fields.each (field) ->
      data[field.id()] = field.value()
    
    data
  
  @method 'save', ->
    item = if @_item
      @_item.set @data()
      @_item
    else if @_scope
      @_scope.build(@data())
    else
      @_model.createWithData(@data())
    @trigger 'saved', item
    
  @method 'submit', ->
    ST.command @_command, @method('save')
    @_dialog.close() if @_dialog
  
  @method 'cancel', ->
    @trigger 'cancelled'
    @_dialog.close() if @_dialog
  
  @method 'dialogButtons', (dialog, buttonbar) ->
    @_dialog = dialog
    self = this
    buttonbar.button '&nbsp;&nbsp;OK&nbsp;&nbsp;', @method('submit')
    buttonbar.button 'Cancel', @method('cancel')
    dialog.cancelFunction @method('cancel')