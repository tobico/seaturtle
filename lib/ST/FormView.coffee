#require ST/View
#require ST/TextFieldView
#require ST/ModelFieldView

ST.class 'FormView', 'View', ->
  @initializer 'withModelAttributes', (model, attributes) ->
    @init()
    @_model = model
    @_attributes = attributes
    @_command = 'Save Form'
    @_fields = {}
  
  @initializer 'withScopeAttributes', (scope, attributes) ->
    @initWithModelAttributes scope.model(), attributes
    @_scope = scope
  
  @initializer 'withItemAttributes', (item, attributes) ->
    @initWithModelAttributes item._class, attributes
    @_item = item

  @property 'defaults'
  @property 'model'
  @property 'item'
  @property 'command'
  
  @destructor ->
    for attribute, field of @_fields
      if @_fields.hasOwnProperty attribute
        field.release()
    @super()
  
  @method 'render', ->
    html = ['<table class="formView">']
    for attribute in @_attributes
      html.push '<tr><th class="label"><label for="', attribute, '">', @_model.labelForAttribute(attribute), ':</label></th><td class="field" data-attribute="', attribute, '"></td></tr>'
    html.push '</table>'
    
    @_element.html html.join('')
    
    cells = $ 'td.field', @_element
    for cell in cells
      attribute = $(cell).attr 'data-attribute'
      details = @_model._attributes[attribute]
      field = switch details.type
        when 'belongsTo'
          ST.ModelFieldView.createWithModel @_model._namespace.class(details.model)
        when 'enum'
          ST.EnumFieldView.createWithValuesNull details.values, details.null
        else
          ST.TextFieldView.create()
      field.id attribute
      field.bind 'submit', this
      field.searchRemotelyAt details.searchesRemotelyAt if details.searchesRemotelyAt
      @_fields[attribute] = field
      field.value(
        if @_item
          @_item[attribute]()
        else if @_defaults && @_defaults[attribute]
          @_defaults[attribute]
        else
          details.default
      )
      field.load()
      $(cell).append field.element()
  
  @method 'data', ->
    data = {}
    
    # Copy default values into data
    for attribute of @_defaults
      if @_defaults.hasOwnProperty attribute
        data[attribute] = @_defaults[attribute]
    
    # Read field values into data
    for attribute in @_attributes
      field = @_fields[attribute]
      data[attribute] = field.value()
    
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