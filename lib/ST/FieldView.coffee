#= require ST/View

# Base class for fields that are compatible with ST.Form
#
# Child classes must declare the following methods:
#   inputHTML: Return HTML code for the input element
#   convertValue: Convert a value to the correct format
#   getInputValue: Return the current value of the input element
#   setInputValue(value): Update the input element with a new value

ST.class 'FieldView', 'View', ->
  @initializer ->
    @super()
    @_value = @convertValue(null)
    @_inputElement = null
    @_id = null
  
  @property 'value'
  @property 'inputElement'
  @property 'id'
  @accessor 'inputValue'

  @method 'setValue', (newValue) ->
    oldValue = @_value
    @_value = @convertValue newValue
    @inputValue @_value if @_loaded
    @_changed 'value', oldValue, @_value
  
  @method 'render', ->
    @_inputElement = $ @inputHTML()
    @_inputElement.attr 'id', @_id if @_id
    @inputValue @_value
    @_inputElement.bind 'click keyup change', @method('inputChanged')
    @element().append @_inputElement
    
  @method 'focus', ->
    if @_loaded
      input = @_inputElement[0]
      if input && input.focus
        input.focus()
        input.select()
  
  @method 'blur', ->
    if @_loaded
      input = @_inputElement[0]
      input.blur() if input && input.blur
  
  @method 'inputChanged', ->
    oldValue = @_value
    newValue = @inputValue()
    unless oldValue == newValue
      @_value = newValue
      @_changed 'value', oldValue, newValue
  
  @method '_idChanged', (oldValue, newValue) ->
    @_inputElement.attr 'id', newValue if @_loaded