#= require ST/View
#= require ST/TextFieldView
#= require ST/ModelFieldView
#= require ST/EnumFieldView
#= require ST/BoolFieldView
#= require ST/DateTimeFieldView

ST.class 'FormView', 'View', ->
  @retainedProperty 'errors'

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
      _add: (field, attribute, options={}) ->
        field.id attribute
        field.label options.label if options.label
        field.bind 'submit', self
        self._fields.add field
        field.release()
      text: (attribute, options={}) ->
        @_add ST.TextFieldView.create(), attribute, options
      enum: (attribute, options={}) ->
        $.extend options, self.detailsFor(attribute)
        @_add ST.EnumFieldView.createWithValuesNull(options.values, options.null), attribute, options
      bool: (attribute, options={}) ->
        @_add ST.BoolFieldView.create(), attribute, options
      datetime: (attribute, options={}) ->
        @_add ST.DateTimeFieldView.create(), attribute, options
      model: (attribute, options={}) ->
        details = self.detailsFor attribute
        field = ST.ModelFieldView.createWithModel self._model._namespace.class(details.model)
        field.searchRemotelyAt details.searchesRemotelyAt if details.searchesRemotelyAt
        @_add field, attribute, options
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
          if $.isFunction self._item[attribute]
            self._item[attribute]()
          else
            self._item[attribute]
        else if self._defaults && self._defaults[attribute]
          self._defaults[attribute]
        else if details = self.detailsFor(attribute)
          details.default
      )

  @method 'clearValidationErrors', ->
    @_errors.element().empty() if @_errors

  @method 'detailsFor', (attribute) ->
    @_model._attributes[attribute]

  @method 'fieldById', (id) ->
    @_fields.find (field) -> field.id() is id

  @method 'generateTableHTML', ->
    self = this
    html = ['<table class="formView">']
    @_fields.each (field) ->
      attribute = field.id()
      html.push '<tr><th class="label"><label for="', attribute, '">',
        field.label() || self._model.labelForAttribute(attribute),
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

    errors = ST.View.create()
    @errors errors
    @_children.add @_errors
    errors.release()

  @method 'data', ->
    data = {}

    # Copy default values into data
    for attribute of @_defaults
      if @_defaults.hasOwnProperty attribute
        data[attribute] = @_defaults[attribute]

    # Read field values into data
    @_fields.each (field) ->
      data[field.id()] = field.value() || null

    data

  @method 'save', ->
    data = @data()
    if @_model && errors = @_model.validate(data)
      @showValidationErrors errors
      false
    else
      item = if @_item
        if @_item.set
          @_item.set data
        else
          for key, value of data
            @_item[key] = value
        @_item
      else if @_scope
        @_scope.build data
      else
        @_model.createWithData data
      @trigger 'saved', item
      true

  @method 'showValidationErrors', (errors) ->
    @clearValidationErrors()
    for fieldId, fieldErrors of errors
      field = @fieldById fieldId
      hint = $('<div class="error-hint">' + fieldErrors[0] + '</div>')
      hint.css 'top', field.element().parent().position().top
      @_errors.element().append hint

    # Focus on first error
    @_fields.each (field) ->
      if errors[field.id()]
        field.focus()
        'break'

  @method 'submit', ->
    if ST.command @_command, @method('save')
      @_dialog.close() if @_dialog

  @method 'cancel', ->
    @trigger 'cancelled'
    @_dialog.close() if @_dialog

  @method 'dialogButtons', (dialog, buttonbar) ->
    @_dialog = dialog
    self = this
    buttonbar.button '&nbsp;&nbsp;&nbsp;OK&nbsp;&nbsp;&nbsp;&nbsp;', @method('submit')
    buttonbar.button 'Cancel', @method('cancel')
    buttonbar.reverse() if ST.mac()
    dialog.cancelFunction @method('cancel')
