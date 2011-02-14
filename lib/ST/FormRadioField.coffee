ST.subClass 'FormRadioField', 'FormField', ->
  @initializer (options, otherOption) ->
    @super()
    @setOptions options
    @otherOption = otherOption || false
  
  @property 'otherOption'
  
  @method 'addOption', (value, label) ->
    @values.push value
    @labels.push label
    @refresh() if @loaded
  
  @method 'setOptions', (options) ->
    @values = []
    @labels = []
    if options && options.length
      for pair in options
        values.push pair[0]
        labels.push pair[1]
    @refresh if @loaded
  
  @method 'render', (element) ->
    @_super element
    @refresh()
  
  @method 'refresh', ->
    self = this
    
    @element.empty()
    ul = @helper.tag 'ul'
    ul.appendTo @element
    name = 'stformradiofield_' + @_uid;
    foundValue = false
    for i, value in values
      id = name + '_' + i
      
      action = null
      do (value) ->
        action = ->
          self.optionClicked value
      
      input = @helper.tag 'input'
      input.addClass 'radio'
      input.attr {
          type:   'radio',
          name:   name,
          id:     id
      }
      input.click action
      if @value == value
        foundValue = true
        input.attr 'checked', true
      
      label = @helper.tag 'label'
      label.html @labels[i]
      label.attr 'for', id
      ul.append @helper.tag('li').append(input).append(label)
    
    if @otherOption
      id = name + '_other'
      @otherInput = @helper.tag 'input'
      @otherInput.addClass 'radio'
      @otherInput.attr {
          type:   'radio'
          name:   name
          id:     id
      }
      @otherInput.click @methodFn('otherClicked')
      
      label = @helper.tag 'label'
      label.html 'Other &mdash;'
      label.attr 'for', id
      
      @otherTextInput = @helper.tag 'input'
      @otherTextInput.attr {
          name:       name + '_text'
          disabled:   true
      }
      @otherTextInput.change @methodFn('otherChanged')
      
      @otherTextOverlay = @helper.tag 'div'
      @otherTextOverlay.click ->
        self.otherInput.attr 'checked', true
        self.otherInput.click()
          
      if !foundValue
        @otherInput.attr 'checked', true
        @otherTextInput.removeAttr('disabled').val(@value)
        @otherTextOverlay.hide()
          
      li = @helper.tag 'li'
      li.append @otherInput
      li.append label
      li.append @helper.tag('div').append(@otherTextInput).append(@otherTextOverlay)
      ul.append li
      ul.addClass 'otherOption'
  
  @method 'optionClicked', (value) ->
    if @otherTextInput
      @otherTextInput.attr 'disabled', true
      @otherTextOverlay.show()
    @value = value
  
  @method 'otherClicked', ->
    @otherTextInput.removeAttr('disabled').focus()
    @otherTextOverlay.hide()
    @value = @otherTextInput.val()
  
  @method 'otherChanged', ->
    @value = @otherTextInput.val()
  
  @method 'isValid', -> true