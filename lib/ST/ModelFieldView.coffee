#require ST/TextFieldView

ST.class 'ModelFieldView', 'TextFieldView', ->
  # Mappings for event key code to result index
  @KEY_CODES = { 49:0, 50:1, 51:2, 52:3, 53:4, 54:5, 55:6, 56:7, 57:8, 48:9, 190:10, 191:11, 97:0, 98:1, 99:2, 100:3, 101:4, 102:5, 103:6, 104:7, 105:8, 96:9, 110:10, 111:11 }
  
  @RESULT_LIMIT = 9
  
  # Mappings from result index to label for key
  @KEY_LABELS = '1234567890./*-+'.split('')
  
  @initializer 'withModel', (model) ->
    @init()
    @_model = model
    @_value = null
    @_inputValue = null
    @_searching = false
    @_searchValue = ''
    @_results = null
    @_canCreate = false
  
  @property 'value'
  @property 'inputValue'
  @property 'searching'
  @property 'results'
  @property 'selectedResult'
  @property 'acceptsNull'
  @property 'canCreate'
  @property 'resultListElement'
  
  @method 'render', ->
    @super()
    
    self = this
    
    @_inputElement.attr 'autocomplete', 'off'
    @_inputElement.keydown  @method('inputKeyDown')
    
    @_resultListElement = $ '<div class="ModelFieldViewResults"></div>'
    @_resultListElement.hide()
    @_resultListElement.mouseout ->
      self.selectedResult -1 unless @_hiding
    @element().append @_resultListElement
  
  @method 'inputFocus', ->
    @super()
    @_inputElement.select() if @_value
    @performSearch @_inputElement.val()
  
  @method 'inputBlur', ->
    @_hiding = true
    if @_inputElement.val() == ''
      @value null
      @super()
    else if @_results && @_selectedResult >= 0
      @chooseResult @_results[@_selectedResult]
    else if @_value
      @_inputValue = @_value.toFieldText()
      @_inputElement.val @_inputValue 
    else
      @super()
    @_resultListElement.hide()
    @_hiding = false
  
  @method 'inputChanged', ->
    @inputValue @_inputElement.val()
  
  @method '_inputValueChanged', (oldValue, newValue) ->
    if oldValue != newValue
      @performSearch newValue
  
  @method '_selectedResultChanged', (oldValue, newValue) ->
    if @_resultListElement
      rows = $ 'tr', @_resultListElement
      $(rows[oldValue]).removeClass 'selected' if oldValue >= 0
      $(rows[newValue]).addClass 'selected' if newValue >= 0
    
  @method 'inputKeyDown', (event) ->
    event.stopPropagation()
    switch event.which
      when 38 # UP
        if @_results
          if @_selectedResult > 0
            @selectedResult(@_selectedResult - 1)
          else
            @selectedResult(@_results.length - 1)
        event.preventDefault()
      when 40 # DOWN
        if @_results
          if @_selectedResult < @_results.length - 1
            @selectedResult(@_selectedResult + 1)
          else
            @selectedResult(0)
        event.preventDefault()
      when 13 # ENTER
        @blur()
        event.preventDefault()
      when 27 # Escape
        @blur()
        event.preventDefault()
      else
        if ST.ModelFieldView.KEY_CODES[event.which]?
          n = ST.ModelFieldView.KEY_CODES[event.which]
          if @_results && @_results[n]
            @selectedResult n
            @blur()
            event.preventDefault()
  
  @method 'performSearch', (search) ->
    if search.length
      @_results = @_model.search search
      @showResults()
    else
      @_resultListElement.hide()
  
  @method 'showResults', ->
    self = this
    
    if @_results
      if @_results.length > ST.ModelFieldView.RESULT_LIMIT
        @_results.splice ST.ModelFieldView.RESULT_LIMIT

      html = ['<table><tbody>']
      for result, i in @_results
        html.push '<tr style="cursor: default" onmouseover="selectResult(' + i + ')"><td class="hotkey">'
        html.push ST.ModelFieldView.KEY_LABELS[i]
        html.push '</td><td>'
        html.push result[0].toListItem().join('</td><td>')
        html.push '</td></tr>'
      html.push '</tbody></table>'

      @_resultListElement.html html.join('')

      window.selectResult = (index) ->
        self.selectedResult index
      
      @selectedResult -1

      @_resultListElement.css 'top', @_inputElement.height() + 5
      @_resultListElement.show()
    else
      @_resultListElement.hide()
  
  @method 'chooseResult', (result) ->
    if result && result[0]
      @_inputValue = result[0].toFieldText()
      @_inputElement.val @_inputValue
      @value result[0]