#= require ST/View

ST.class 'BoolFieldView', 'FieldView', ->
  @method 'inputHTML', ->
    '<input type="checkbox" />'
  
  @method 'convertValue', (value) ->
    !!value
  
  @method 'getInputValue', ->
    @_inputElement.is ':checked'
  
  @method 'setInputValue', (value) ->
    if value
      @_inputElement.attr 'checked', 'checked'
    else
      @_inputElement.removeAttr 'checked'