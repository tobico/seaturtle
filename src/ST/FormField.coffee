ST.class 'FormField', 'View', ->
  @constructor ->
    @_super()
    @value = null
  
  @property 'value'
  @property 'label'
  
  @method 'isValid', -> true
  
  @method '_valueChanged', ->
    @trigger 'changed'
  
  @method 'validate', ->
    @valid = @isValid()
    el = $ 'input, select', @getElement()
    if @valid
      el.removeClass 'invalid'
    else
      el.addClass 'invalid'
