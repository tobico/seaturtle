#require ST/View
#require ST/TextFieldView
#require ST/ModelFieldView

ST.class 'FormView', 'View', ->
  @initializer 'withModelAttributes', (model, attributes) ->
    @init()
    @_model = model
    @_attributes = attributes
    @_fields = {}
  
  @initializer 'withScopeAttributes', (scope, attributes) ->
    @initWithModelAttributes scope.model(), attributes
    @_scope = scope
  
  @initializer 'withItemAttributes', (item, attributes) ->
    @initWithModelAttributes item._class, attributes
    @_item = item

  @property 'model'
  @property 'item'
  
  @destructor ->
    for attribute, field of @_fields
      if @_fields.hasOwnProperty attribute
        field.release()
    @super()
  
  @method 'render', ->
    html = ['<table class="formView">']
    for attribute in @_attributes
      html.push '<tr><th class="label"><label for="', attribute, '">', @labelForAttribute(attribute), '</label></th><td class="field" data-attribute="', attribute, '"></td></tr>'
    html.push '</table>'
    
    @_element.html html.join('')
    
    cells = $ 'td.field', @_element
    for cell in cells
      attribute = $(cell).attr 'data-attribute'
      details = @_model.Attributes[attribute]
      field = switch details.type
        when 'belongsTo'
          ST.ModelFieldView.createWithModel @_model._namespace.class(details.model)
        when 'enum'
          ST.EnumFieldView.createWithValues details.values
        else
          ST.TextFieldView.create()
      field.id attribute
      @_fields[attribute] = field
      field.value(if @_item then @_item[attribute]() else details.default)
      field.load()
      $(cell).append field.element()
  
  @method 'labelForAttribute', (attribute) ->
    ST.ucFirst(attribute.replace /([A-Z])/g, " $1") + ':'
  
  @method 'data', ->
    data = {}
    for attribute in @_attributes
      field = @_fields[attribute]
      data[attribute] = field.value()
    data
  
  @method 'save', ->
    if @_item
      @_item.set @data()
    else if @_scope
      @_scope.build @data()
    else
      @_model.createWithData @data()
  
  @method 'dialogButtons', (dialog, buttonbar) ->
    self = this
    buttonbar.button '&nbsp;&nbsp;OK&nbsp;&nbsp;', ->
      self.save()
      dialog.close()
    buttonbar.button 'Cancel', ->
      dialog.close()