#require ST/View
#require ST/TextFieldView

ST.class 'FormView', 'View', ->
  @initializer 'withModelAttributes', (model, attributes) ->
    @init()
    @_model = model
    @_attributes = attributes
    
  @initializer 'withItemAttributes', (item, attributes) ->
    @initWithModelAttributes item._class, attributes
    @_item = item

  @property 'model'
  @property 'item'
  
  @method 'render', ->
    html = ['<table class="formView">']
    for attribute in @_attributes
      html.push '<tr><td><label for="', attribute, '">', attribute, '</label></td><td class="field" data-attribute="', attribute, '"></td></tr>'
    html.push '</table>'
    
    @_element.html html.join('')
    
    cells = $ 'td.field', @_element
    for cell in cells
      attribute = $(cell).attr 'data-attribute'
      field = ST.TextFieldView.create()
      field.value @_item[attribute]() if @_item
      field.load()
      @_children.add field
      $(cell).append field.element()
      field.release()
  
  @method 'save', ->
    self = this
    
    return if @saved
    
    # Check if all fields are valid
    if @fields.all 'isValid'
      # Save values in fields to record
      @fields.each (field) ->
        (self.record.set || STObject.prototype.set).call self.record, field.member, field.getValue() if field.member
      @saved = true
      
      # Trigger saved event
      @trigger 'saved'
      Dialog.hide()
    else
      # Hilight invalid fields
      @fields.each 'validate'
      
      # Focus on first invalid field
      invalid = $('input.invalid, select.invalid', @getElement())
      invalid[0].focus() if invalid.length
  
  @method 'showDialog', (events) ->
    events ||= {}
    events.onCancel ||= Dialog.hide
    @super events