ST.class 'FormFixedField', 'FormField', ->
  @constructor 'withValueText', (fixedValue, text) ->
    @init()
    @fixedValue = fixedValue
    @setValue fixedValue
    @text = text
  
  @method 'setValue', (value) ->
    # Only allow value to be set to predefined fixed value
    @_super @fixedValue
  
  @method 'render', (element) ->
    @_super element;
    element.text @text
