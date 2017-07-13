#= require ST/FieldView

ST.class 'TextFieldView', 'FieldView', ->
  @initializer ->
    @super()
    @_autoTrim = true
    @_placeholder = ''
  
  @property 'autoTrim'
  @property 'placeholder'
  
  @method 'inputHTML', ->
    '<input type="text" class="text" />'
  
  @method 'convertValue', (value) ->
    if value? then String(value) else null
  
  @method 'getInputValue', ->
    value = @_inputElement.val()
    value = $.trim value if @_autoTrim && value
    value
  
  @method 'setInputValue', (value) ->
    if value && value.length
      @_inputElement.val value
      @_inputElement.removeClass 'placeholder'
    else
      @_inputElement.val @_placeholder
      @_inputElement.addClass 'placeholder'
  
  @method 'render', ->
    @super()
    @_inputElement.bind   'keydown', @method('keyDown')
    @_inputElement.focus  @method('inputFocus')
    @_inputElement.blur   @method('inputBlur')
  
  @method 'keyDown', (e) ->
    @trigger 'submit' if e && e.which && e.which == 13
  
  @method 'inputFocus', ->
    if @_inputElement.val() == @_placeholder
      @_inputElement.val ''
      @_inputElement.removeClass 'placeholder'

  @method 'inputBlur', ->
    if @_inputElement.val() == ''
      @_inputElement.val @_placeholder
      @_inputElement.addClass 'placeholder'
  
  @method '_placeholderChanged', (oldPlaceholder, newPlaceholder) ->
    if @_loaded && @_inputElement.val() == oldPlaceholder
      @_inputElement.val newPlaceholder
      @_inputElement.addClass 'placeholder'