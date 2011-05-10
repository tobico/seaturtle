#require ST/TextFieldView

ST.class 'ModelFieldView', 'TextFieldView', ->
  # Mappings for event key code to result index
  @KEY_CODES = { 49:0, 50:1, 51:2, 52:3, 53:4, 54:5, 55:6, 56:7, 57:8, 48:9, 97:0, 98:1, 99:2, 100:3, 101:4, 102:5, 103:6, 104:7, 105:8, 96:9 }
  
  @RESULT_LIMIT = 9
  
  # Mappings from result index to label for key
  @KEY_LABELS = '123456789'.split('')
  
  @initializer 'withModel', (model) ->
    @init()
    @_model = model
    @_scope = null
    @_value = null
    @_inputValue = null
    @_searching = false
    @_searchValue = ''
    @_results = null
    @_canCreate = false
    @_createLabel = null
    @_focused = false
    @_searchRemotelyAt = null
  
  @initializer 'withScope', (scope) ->
    @initWithModel scope.model()
    @_scope = scope
  
  @property 'value'
  @property 'inputValue'
  @property 'searching'
  @property 'results'
  @property 'selectedResult'
  @property 'acceptsNull'
  @property 'resultListElement'
  @property 'searchRemotelyAt'
  
  @method 'allowCreateWithLabel', (label) ->
    @_canCreate = true
    @_createLabel = label
  
  @method 'render', ->
    @super()
    
    self = this
    
    @_inputElement.attr 'autocomplete', 'off'
    @_inputElement.attr 'autocorrect', 'off'
    @_inputElement.keydown  @method('inputKeyDown')
    if @_inputValue && @_inputValue.length
      @_inputElement.val @_inputValue
      @_inputElement.css 'color', 'inherit'
    else
      @_inputElement.val @_placeholder
      @_inputElement.css 'color', 'gray'
    @_inputElement.bind 'choose', (e, text) ->
      self.chooseByText text
    
    @_resultListElement = $ '<div class="ModelFieldViewResults"></div>'
    @_resultListElement.hide()
    @_resultListElement.mouseout ->
      self.selectedResult -1 unless @_hiding
    @element().append @_resultListElement
  
  @method 'inputFocus', ->
    @super()  
    @_focused = true
    @_inputElement.select() if @_value
    inputValue = ST.trim(@_inputElement.val())
    unless @_value && inputValue == @_value.toFieldText()
      @performSearch inputValue
  
  @method 'inputBlur', ->
    @_hiding = true
    if @_inputValue == ''
      @value null
      @trigger 'valueChosen', null
      @super()
    else if @_results && @_selectedResult >= 0
      @chooseResult @_results[@_selectedResult]
    else if @_value
      @_inputValue = @_value.toFieldText()
      @_inputElement.val @_inputValue 
    else
      @inputValue ''
      @super()
    @_resultListElement.hide()
    @_hiding = false
    @_focused = false
    @trigger 'blurred'
  
  @method 'inputChanged', ->
    value = @_inputElement.val()
    @inputValue value unless @_inputValue == value
  
  @method '_inputValueChanged', (oldValue, newValue) ->
    newValue = ST.trim newValue
  
    if @_loaded && ST.trim(@_inputElement.val()) != newValue
      if newValue == '' && !@_focused
        @_inputElement.css 'color', 'gray'
        @_inputElement.val @_placeholder
      else
        @_inputElement.css 'color', 'inherit'
        @_inputElement.val newValue
    
    if @_focused && oldValue != newValue
      @performSearch newValue
  
  @method '_selectedResultChanged', (oldValue, newValue) ->
    if @_resultListElement
      rows = $ 'tr', @_resultListElement
      rows.eq(oldValue).removeClass 'selected' if oldValue >= 0
      rows.eq(newValue).addClass 'selected' if newValue >= 0
  
  @method '_valueChanged', (oldValue, newValue) ->
    @inputValue(if newValue then newValue.toFieldText() else '')
  
  @method 'inputKeyDown', (event) ->
    event.stopPropagation()
    switch event.which
      when 38 # Up
        if @_results
          if @_selectedResult > 0
            @selectedResult(@_selectedResult - 1)
          else
            @selectedResult(@_results.length - 1)
        event.preventDefault()
      when 40 # Down
        if @_results
          if @_selectedResult < @_results.length - 1
            @selectedResult(@_selectedResult + 1)
          else
            @selectedResult(0)
        event.preventDefault()
      when 13 # Enter
        @blur() if @_selectedResult >= 0 || @_inputValue == ''
        event.preventDefault()
      when 27 # Escape
        @blur()
        event.preventDefault()
      when 48, 190, 110 # 0
        if @_canCreate
          @selectedResult(@_results.length - 1)
          @blur()
          event.preventDefault()
      when 9 # Tab
        event.preventDefault() if @_searching || @_results
      else
        if ST.ModelFieldView.KEY_CODES[event.which]?
          n = ST.ModelFieldView.KEY_CODES[event.which]
          if @_results && @_results[n]
            @selectedResult n
            @blur()
            event.preventDefault()
  
  @method 'performSearch', (search) ->
    self = this 
    if @_searching
      @_searchForNext = search
    else if search.length
      remote = !@_scope && @_model.searchRemotely search, {url: @_searchRemotelyAt}, (results) ->
        self._searching = false
        if !self._focused
          self._resultListElement.hide()
        else if self._searchForNext?
          self.performSearch self._searchForNext
        else
          self.showResults results
        self._searchForNext = null
      
      if remote
        @_searching = true
        @showSearchProgress()
      else
        @showResults (@_scope || @_model).search(search)
    else
      @_results = null
      @_resultListElement.hide()
  
  @method 'showSearchProgress', ->
    @_resultListElement.html '<table><tr><td>Searching...</td></tr></table>'
    @_resultListElement.css 'top', @_inputElement.outerHeight()
    @_resultListElement.show()
  
  @method 'showResults', (results) ->
    self = this
    
    @_results = results
    if @_results || @_canCreate
      if @_results.length > ST.ModelFieldView.RESULT_LIMIT
        @_results.splice ST.ModelFieldView.RESULT_LIMIT
      
      html = ['<table><tbody>']
      maxCols = 1
      for result, i in @_results
        html.push '<tr style="cursor: default" onmouseover="selectResult(' + i + ')"><td class="hotkey">'
        html.push ST.ModelFieldView.KEY_LABELS[i]
        html.push '</td><td>'
        cols = result[0].toListItem()
        maxCols = cols.length if cols.length > maxCols
        html.push cols.join('</td><td>')
        html.push '</td></tr>'
      
      if @_canCreate
        html.push '<tr style="cursor: default" onmouseover="selectResult(', results.length, ')"><td class="hotkey">0</td><td colspan="', maxCols, '">Create new ', @_model._name.toLowerCase()
        html.push ' ', @_createLabel.replace('$1', @_inputValue)
        results.push 'new'
      
      html.push '</tbody></table>'
      
      @_resultListElement.html html.join('')
      
      window.selectResult = (index) ->
        self.selectedResult index
      
      @selectedResult -1
      
      @_resultListElement.css 'top', @_inputElement.outerHeight()
      @_resultListElement.show()
    else
      @_resultListElement.hide()
  
  @method 'chooseResult', (result) ->
    if result == 'new'
      @trigger 'create', @_inputValue
    else if result && result[0]
      @value result[0]
      @trigger 'valueChosen', result[0]
    @_results = null
  
  @method 'chooseByText', (text) ->
    if text == 'new'
      @chooseResult 'new'
    else if @_results
      for result in @_results
        return @chooseResult result if result[0].toFieldText().indexOf(text) >= 0