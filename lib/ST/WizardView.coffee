#= require ST/View

ST.class 'WizardView', ST.View, ->
  @initializer ->
    @super()

    @_steps = []
    @_stepIndex = -1
    @_data = {}
    
    # Build box for step details
    @_stepElement = $ '<div style="height: 200px"></div>'
    @_element.append @_stepElement
  
  @accessor 'height'
  @property 'data'
  @property 'steps'
  @property 'stepIndex'
  
  @method 'addStep', (stepDefinition) ->
    @_steps.push stepDefinition
    @stepIndex 0 if @stepIndex() == -1
  
  @method 'render', ->
    # Load current step
    unless @_stepIndex == -1
      @renderStep @_steps[@_stepIndex]
      @updateButtons()
  
  @method 'dialogButtons', (dialog, buttonbar) ->
    @_dialog = dialog
    @_buttonBar = buttonbar
    if @_steps.length > 1
      @_backButton = buttonbar.button '&lt; Back', @method('lastStep')
    @_nextButton = buttonbar.button 'Next &gt;', {default: true}, @method('nextStep')
    @_cancelButton = buttonbar.button 'Cancel', {cancel: true}, @method('cancel')
    dialog.cancelFunction @method('cancel')
    buttonbar.load()
    @updateButtons()
    
  @method 'renderStep', (stepDefinition) ->
    self = this
    element = @_stepElement
    data = @_data
    element.empty()
    components = {
      paragraph: (text) ->
        element.append "<p>#{text}</p>"
      radioGroup: (options) ->
        data[options.field] ||= options.default
        ul = self.helper().tag('ul').addClass 'radio-group'
        for value, label of options.options
          do (value) ->
            input = $ "<input type=\"radio\" name=\"#{options.field}\" value=\"#{value}\" />"
            li = self.helper().tag('li').addClass('radio-item').append(
              input, "<label> #{label}</label>"
            )
            li.click ->
              data[options.field] = value
              $('input', this).attr 'checked', true
              $(this).siblings('.radio-item-selected').removeClass('radio-item-selected')
              $(this).addClass('radio-item-selected')
            if value == data[options.field]
              input.attr 'checked', true
              li.addClass('radio-item-selected')
            ul.append li
        element.append ul
      checkbox: (options) ->
        data[options.field] ||= options.default
        input = $ "<input type=\"checkbox\" id=\"#{options.field}\" />"
        input.bind 'click change', ->
          data[options.field] = input[0].checked
          undefined
        input.attr 'checked', true if data[options.field]
        element.append input, "<label for=\"#{options.field}\"> #{options.title}</label>"
    }
    stepDefinition.call components
  
  @method 'getHeight', ->
    @_stepElement.css 'height'
  
  @method 'setHeight', (value) ->
    @_stepElement.css 'height', value
  
  @method 'updateButtons', ->
    if @_buttonBar
      @_buttonBar.buttonDisabled @_backButton, @atFirstStep()
      @_buttonBar.buttonTitle @_nextButton, if @atLastStep() then 'Finish' else 'Next &gt;'
    
  @method '_stepIndexChanged', (oldValue, newValue) ->
    if @_loaded
      @renderStep @_steps[newValue]
      @updateButtons()
  
  @method 'atFirstStep', ->
    @_stepIndex == 0
  
  @method 'atLastStep', ->
    @_stepIndex == @_steps.length - 1
  
  @method 'nextStep', ->
    if @atLastStep()
      @finish()
    else
      @stepIndex @_stepIndex + 1 if @_stepIndex < @_steps.length - 1
  
  @method 'lastStep', ->
    @stepIndex @_stepIndex - 1 if @_stepIndex > 0
  
  @method 'finish', ->
    @_dialog.close() if @_dialog
    @trigger 'finished', @_data
  
  @method 'cancel', ->
    @_dialog.close() if @_dialog
    @trigger 'cancelled'