#= require ST/View

ST.class 'WizardView', ST.View, ->
  @initializer ->
    @super()
    @_steps = []
    @_stepIndex = -1
    @_data = {}
  
  @property 'data'
  @property 'steps'
  @property 'stepIndex'
  
  @method 'addStep', (stepDefinition) ->
    @_steps.push stepDefinition
    @stepIndex 0 if @stepIndex() == -1
  
  @method 'render', ->
    # Build box for step details
    @_stepElement = $ '<div style="height: 200px"></div>'
    @_element.append @_stepElement
    
    # Load current step
    unless @_stepIndex == -1
      @renderStep @_steps[@_stepIndex]
      @updateButtons()
  
  @method 'dialogButtons', (dialog, buttonbar) ->
    @_dialog = dialog
    @_buttonBar = buttonbar
    if @_steps.length > 1
      @_backButton = buttonbar.button '&lt; Back', @method('lastStep')
    @_nextButton = buttonbar.button 'Next &gt;', @method('nextStep')
    @_cancelButton = buttonbar.button 'Cancel', @method('cancel')
    dialog.cancelFunction @method('cancel')
    buttonbar.load()
    @updateButtons()
    
  @method 'renderStep', (stepDefinition) ->
    element = @_stepElement
    data = @_data
    element.empty()
    components = {
      paragraph: (text) ->
        element.append "<p>#{text}</p>"
      radioGroup: (options) ->
        data[options.field] ||= options.default
        for value, label of options.options
          do (value) ->
            id = options.field + '_' + value
            input = $ "<input type=\"radio\" id=\"#{id}\" name=\"#{options.field}\" />"
            input.click ->
              data[options.field] = value
            input.attr 'checked', true if value == data[options.field]
            element.append input, "<label for=\"#{id}\"> #{label}</label><br />"
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