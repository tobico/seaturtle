ST.class 'Form', 'View', ->
  @initializer 'withRecord', (record) ->
    @super()
    @record = record
    @fields = List.create()
    @fields.bind 'itemAdded', this, 'fieldAdded'
    @fields.bind 'itemRemove', this, 'fieldRemoved'
    @element.addClass 'STForm'
  
  @property 'record', null, 'readonly'
  
  @destructor ->
    self = this;
    @releaseMembers 'fields', 'record'
    @super()
  
  @method 'addField', (field) ->
    @fields.add field
    field.setValue (@record.get || STObject.prototype.get).call(@record, field.member) if field.member
  
  @method 'fieldAdded', (list, field) ->
    field.bind 'submit', this, 'fieldSubmitted'

  @method 'fieldRemoved', (list, field) ->
    field.unbind 'submit', this
  
  @method 'fieldSubmitted', (field) ->
    @save()
  
  @method 'addAndReleaseField', (field) ->
    @addField field
    field.release()
  
  @method 'render', (element) ->
    @super element
    self = this
    
    table = @helper.tag 'table'
    table.css 'width', '100%'
    @fields.each (field) ->
      tr = self.helper.tag 'tr'
      tr.append self.helper.tag('td').html(field.label || '')
      tr.append self.helper.tag('td').append(field.load().getElement())
    element.append table
    
    buttonbar = @helper.tag 'buttonbar'
    buttonbar.append @helper.linkTag('&nbsp;&nbsp;OK&nbsp;&nbsp;', @methodFn('save')).addClass('button')
    buttonbar.append ' '
    buttonbar.append @helper.linkTag('Cancel', Dialog.hide).addClass('button')
    element.append buttonbar
  
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