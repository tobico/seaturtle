#require ST/View

ST.class 'EnumFieldView', 'View', ->
  @initializer 'withValuesNull', (values, _null) ->
    @init()
    @_value = if _null then null else values[0][1]
    @_null = _null
    @_values = values
    @_valueIndex = {}
    @_selectElement = null
    @_id = null
  
  @property 'value'
  @property 'values'
  @property 'selectElement'
  @property 'id'
  
  @method 'isValueValid', (value) ->
    if value is null
      @_null
    else
      for option in @_values
        return true if option[1] == value
      false
  
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
    for option in @_values
      html.push '<option value="', option[1], '"'
      html.push ' selected="selected"' if @_value == option[1]
      html.push '>', option[0], '</option>'
      @_valueIndex[option[1]] = index++
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
  
  @method 'setValue', (newValue) ->
    if @isValueValid(newValue)
      @_value = newValue
      if @_skipUpdate
        @_skipUpdate = false
      else if @_loaded
        @_selectElement[0].selectedIndex = if @_valueIndex[newValue]? then @_valueIndex[newValue] else 0
  
  @method '_valuesChanged', (oldValues, newValues) ->
    @value null unless @isValueValid(@value)
    @renderOptions() if @_loaded
  
  @method '_idChanged', (oldValue, newValue) ->
    @_selectElement.attr 'id', newValue if @_loaded