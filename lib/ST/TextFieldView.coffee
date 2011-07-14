#require ST/View

ST.class 'TextFieldView', 'View', ->
  @initializer ->
    @super()
    @_value = ''
    @_autoTrim = true
    @_placeholder = ''
    @_inputElement = null
    @_id = null
  
  @property 'value'
  @property 'autoTrim'
  @property 'placeholder'
  @property 'inputElement'
  @property 'id'

  @method 'setValue', (newValue) ->
    oldValue = @_value
    @_value = if newValue? then String(newValue) else null
    @_inputElement.val(@_value || '') if @_loaded
    @_changed 'value', oldValue, @_value
  
  @method 'render', ->
    @_inputElement = $ '<input type="text" class="text" />'
    @_inputElement.attr 'id', @_id if @_id
    if @_value && @_value.length
      @_inputElement.val @_value
      @_inputElement.removeClass 'placeholder'
    else
      @_inputElement.val @_placeholder
      @_inputElement.addClass 'placeholder'
    @_inputElement.bind   'keydown', @method('keyDown')
    @_inputElement.bind   'keyup change', @method('inputChanged')
    @_inputElement.focus  @method('inputFocus')
    @_inputElement.blur   @method('inputBlur')
      
    @element().append     @_inputElement
  
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
  
  @method 'keyDown', (e) ->
    @trigger 'submit' if e && e.which && e.which == 13
  
  @method 'inputChanged', ->
    oldValue = @_value
    newValue = @_inputElement.val()
    unless oldValue == newValue
      @_value = newValue
      @_value = $.trim @_value if @_autoTrim
      @_changed 'value', oldValue, newValue
  
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
  
  @method '_idChanged', (oldValue, newValue) ->
    @_inputElement.attr 'id', newValue if @_loaded