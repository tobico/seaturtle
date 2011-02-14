# Form field for a date value. Requires "date.js"
ST.class 'FormDateField', 'FormField', ->
  @initializer ->
    @super()
    @allowNull = true
    
  @property 'allowNull'
  
  @method 'setValue', (value) ->
    @super value
    @inputTag.val value if @loaded
  
  @method 'render', (element) ->
    @super element
    @inputTag = @helper.tag 'input'
    @inputTag.addClass 'text'
    @inputTag.bind 'keyup change', @methodFn('inputChanged')
    @preview = @helper.tag 'div'
    @updatePreview()
        
    @inputTag.val @value if @value?
    
    element.append @inputTag, @preview
  
  @method 'updatePreview', ->
    if @value
      @preview.show()
      if @value == 'Invalid Date'
        @preview.html 'Invalid Date &mdash; Try format &lsquo;' + (new Date()).toString('d MMM yyyy') + '&rsquo;'
      else
        @preview.text @value.toString('d MMMM yyyy')
    else
      @preview.hide()
  
  @method 'inputChanged', ->
    s = $.trim @inputTag.val()
    @value = if s == '' then null; else Date.parse(s) || 'Invalid Date'
    @updatePreview()
    @trigger 'valueChanged', @value
  
  @method 'isValid', ->
    false if !@allowNull && @value == null
    true