ST.class 'FormTextField', 'FormField', ->
  @initializer ->
    @_super()
    
    @autoTrim = true
    @minLength = null
    @maxLength = null
    @value = ''
  
  @property 'autoTrim'
  @property 'minLength'
  @property 'maxLength'
  
  @method 'setValue', (value) ->
    @super value
    @inputTag.val value if @loaded
  
  @method 'render', (element) ->
    @super element
    @inputTag = @helper.tag 'input'
    @inputTag.val @value if @value?
    @inputTag.addClass 'text'
    @inputTag.bind 'keypress change', @methodFn('inputChanged')
    element.append @inputTag
  
  @method 'inputChanged', (e) ->
    if e && e.which && e.which == 13
      @trigger 'submit'
    else
      @value = @inputTag.val()
      @value = $.trim @value if @autoTrim
      @trigger 'changed', @value
  
  @method 'isValid', ->
    l = @value && @value.length
    return false if @minLength? && l < @minLength
    return false if @maxLength? && l > @maxLength
    true