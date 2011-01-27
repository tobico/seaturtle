ST.class 'FormOptionsField', 'FormField', ->
  @constructor ->
    @_super()
    @options = []
    @labels = []
    @allowNull = false
  
  @property 'options'
  @property 'labels'
  @property 'allowNull'
  
  @method 'render', (element) ->
    @_super element
    @refresh()
    
  @method 'refresh', ->
    self = this
    
    @element.empty()
    for i, option in @options
      button = @helper.tag 'button'
      button.html @labels[i] || @options[i]
      button.click ->
        self.value = self.options[i]
        self.trigger 'valueChanged', self.value
        $('.option_sel', self.element).removeClass 'option_sel'
        button.addClass 'option_sel'
      button.addClass 'option'
      if @options[i] == @value
        button.addClass 'option_sel'
      @element.append button
  
  @method 'isValid', ->
    return false if @value == null && !@allowNull
    return true
