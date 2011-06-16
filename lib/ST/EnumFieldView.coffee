#require ST/View

ST.class 'EnumFieldView', 'View', ->
  @initializer 'withValuesNull', (values, _null) ->
    @init()
    @_value = null
    @_null = _null
    @_values = values
    @_valueIndex = {}
    @_selectElement = null
    @_id = null
  
  @property 'value'
  @property 'values'
  @property 'selectElement'
  @property 'id'
  
  @method 'render', ->
    @_selectElement = $ '<select />'
    @_selectElement.attr 'id', @_id if @_id
    @renderOptions()
    @_selectElement.bind   'keyup change', @method('selectChanged')
    @element().append     @_selectElement
  
  @method 'renderOptions', ->
    index = 1
    html = []
    if @_null
      html.push '<option value=""'
      html.push ' selected="selected"' if @_value is null
      html.push '></option>'
    for value, label of @_values
      if @_values.hasOwnProperty value
        html.push '<option value="', value, '"'
        html.push ' selected="selected"' if @_value == value
        html.push '>', label, '</option>'
        @_valueIndex[value] = index++
    @_selectElement.html html.join('')
  
  @method 'selectChanged', (e) ->
    if e && e.which && e.which == 13
      @trigger 'submit'
    else
      oldValue = @_value
      option = @_selectElement[0].options[@_selectElement[0].selectedIndex]
      newValue = if option && option.value.length then option.value else null
      unless oldValue == newValue
        @_skipUpdate = true
        @value newValue
  
  @method '_valueChanged', (oldValue, newValue) ->
    if @_skipUpdate
      @_skipUpdate = false
    else if @_loaded
      @_selectElement[0].selectedIndex = if @_valueIndex[newValue]? then @_valueIndex[newValue] else 0
  
  @method '_valuesChanged', (oldValues, newValues) ->
    @value null unless @_values[@_value]
    @renderOptions() if @_loaded
  
  @method '_idChanged', (oldValue, newValue) ->
    @_selectElement.attr 'id', newValue if @_loaded