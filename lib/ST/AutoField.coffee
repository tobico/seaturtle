ST.class 'AutoField', 'View', ->
  # Mappings for event key code to result index
  @KEY_CODES = { 49:0, 50:1, 51:2, 52:3, 53:4, 54:5, 55:6, 56:7, 57:8, 48:9, 190:10, 191:11, 97:0, 98:1, 99:2, 100:3, 101:4, 102:5, 103:6, 104:7, 105:8, 96:9, 110:10, 111:11 }
  
  # Mappings from result index to label for key
  @KEY_LABELS = '1234567890./*-+'.split('')
  
  @initializer ->
    @super()
    @searches = STList.create()
    @searcherOptions = {}
    @element.addClass 'STAutoField'
    @label = ''
    @inputElement = null
    @labelElement = null
    @idInputElement = null
    @name = null
    @searching = false
    @searchValue = ''
    @results = null
    @acceptsNull = false
    @popupWidth = null
    @placeholder = ''
    @resultsLimit = 9
  
  @property 'acceptsNull'
  @property 'acceptsCustom'
  @property 'name'
  @property 'label'
  @property 'inputElement', null, 'readonly'
  @property 'placeHolder'
  @property 'popupWidth'
  @property 'resultsLimit'
  
  @destructor ->
    self = this
    @searchers.each (searcher) ->
      searcher.unbindAll self
    @super()
  
  @method 'setLabel', (newLabel) ->
    @label = newLabel
    @labelElement.html label if @loaded
  
  @method 'getValue', ->
    @loaded && @inputElement.val()
  
  # Sets the current value (text) of input field.
  @method 'setValue', (newValue, performSearch=false) ->
    if @loaded
      @inputElement.val value
      if performSearch && value && value != ''
        @labelElement.hide()
        @performSearch value
  
  @method 'setName', (newName, value) ->
    @name = newName
    if @idInputElement
      @idInputElement.attr 'name', @name
    else
      @idInputElement = @helper.tag('input').attr {
          type:   'hidden'
          name:   @name
          value:  value || null
      }
      @getElement().append @idInputElement
  
  @method 'addSearcher', (searcher, options) ->
    @searchers.add searcher
    searcher.bind 'resultsUpdated', this, 'searcherResultsUpdated'
    @searcherOptions[searcher._uid] = options
    
  @method 'render', (element) ->
    @super element
    
    self = this
    
    id = 'STAutoFieldInput' + @_uid;
    
    @inputElement = @helper.tag 'input'
    @inputElement.attr {
        id:             id
        autocomplete:   'off'
    }
    @inputElement.addClass 'text'
    @inputElement.css 'width', '100%'
    @inputElement.keyup   @methodFn('inputChanged')
    @inputElement.keydown @methodFn('inputKey')
    @inputElement.focus   @methodFn('focused')
    @inputElement.blur    @methodFn('blurred')
    
    div = @helper.tag 'div'
    div.append @inputElement
    div.css {
      overflow: 'hidden'
      'padding-right': '6px'
    }
    @element.append div
    
    @labelElement = @helper.tag 'label'
    @labelElement.html @label
    @labelElement.attr 'for', id
    @labelElement.css {
        position: 'absolute'
        left:     '5px'
        top:      '3px'
        color :   '#666'
        cursor:   'text'
    }
    @element.append @labelElement
    
    @resultList = @helper.tag 'table'
    @resultList.hide()
    @resultList.hover(->
      self.mouseOverResults = true
    , ->
      self.mouseOverResults = false
    )
    @resultList.addClass  'STAutoFieldResults'
    @element.append @labelElement
  
  @method 'inputChanged', ->
    return @ignoreChange = false if @ignoreChange
    
    search = @inputElement.val()
    if search.length
      return if search == @searchValue
      @labelElement.hide()
      @performSearch s
    else
      @labelElement.show()
      @resultList.hide()
      @results = null
      if @idInputElement && @acceptsNull
        @idInputElement.val ''
  
  @method 'getSelectedResult', ->
    if @results
      @selectedResult
    else
      null
  
  @method 'setSelectedResult', (newSelectedResult) ->
    return unless @results
    
    if @results[@selectedResult]
      @results[@selectedResult].tr.removeClass 'active'
    
    @selectedResult = newSelectedResult    
    @selectedResult = @results.length - 1 if @selectedResult < 0
    @selectedResult = 0 if @selectedResult >= @results.length

    if @results[@selectedResult]
      @results[@selectedResult].tr.addClass 'active'    
  
  @method 'inputKey', (event) ->
    event.stopPropagation()
    switch event.which
      when 38 # UP
        @setSelectedResult @selectedResult - 1 if @results
      when 40 # DOWN
        @setSelectedResult @selectedResult + 1 if @results
      when 13 # ENTER
        if @results
          @selectResult @results[@selectedResult]
        else
          val = @getValue()
          if val == '' && @acceptsNull
            @selectResult null
          else if val != '' && @acceptsCustom
            @selectResult {custom: val}
          else
            @cancelInput()
      when 27 # Escape
        @cancelInput()
      when 9 # Tab
        if @results && @results.length
          @selectResult @results[@selectedResult]
        else
          return
      else
        if STAutoField.KEY_CODES[e.which]?
          n = STAutoField.KEY_CODES[e.which]
          if @results && @results[n]
            @selectResult @results[n]
          else
            return
        else
          return
    event.preventDefault()
  
  @method 'focus', ->
    ST.error "Can't focus on AutoField until loaded" unless @loaded
    @inputElement[0].focus()
    @inputElement[0].select()
  
  @method 'blur', ->
    ST.error "Can\'t blur AutoField until loaded'" unless @loaded
    @inputElement[0].blur()
  
  @method 'focused', ->
    if @inputElement.val() == @placeholder
      @inputElement.val ''
      @inputElement.css 'color', 'inherit'
  
  @method 'blurred', ->
    if @mouseOverResults
      @selectResult @results[@selectedResult]
    else
      if @inputElement.val() == ''
        @inputElement.val @placeholder
        @inputElement.css 'color', 'gray'
      @cancelInput()
  
  @method 'performSearch', (search) ->
    self = this;
    
    if @searching  
      #Todo: Cancel search and start new search
      return if @searching == search
    
    @searching = search
    @searchersStillSearching = @searchers.toArray()
    
    @results = []
    @searchers.each (searcher) ->
      searcher.search search
  
  @method 'searcherResultsUpdated', (searcher) ->
    self = this
    return if @searching
    @searchersStillSearching.remove searcher
    unless @searchersStillSearching.length
      newResults = []
      @searchers.each (searcher) ->
        acceptResults = self.resultsLimit - newResults.length
        searcherOptions = self.searcherOptions[searcher._uid] || {}
        if searcherOptions.limit
          acceptResults = Math.min searcherOptions.limit, acceptResults
        searcher.results.each (result) ->
            newResults.push result
            acceptResults--
            return 'break' unless acceptResults
        return break if newResults.length >= self.resultsLimit
      @results = newResults
      @showResults @searching, newResults
      oldTerm = @searching
      @searching = false
      newTerm = @getValue()
      if newTerm.length && newTerm != oldTerm
        @performSearch newTerm
  
  @method 'showResults', (term, results) ->
    self = this

    results = results.length && results
    @searchValue = term
    
    unless @results
      @resultList.hide()
      STAutoField.Active = null
      return
    
    STAutoField.Active = this
    
    results.splice @resultsLimit if results.length > @resultsLimit
    
    @resultList.empty()
    for i, result in results
      do (i) ->
        tr = self.helper.tag 'tr'
        tr.append self.helper.tag('td').append(STAutoField.KEY_LABELS[i]).addClass('hotkey')
        tr.append self.helper.tag('td').append(result.label)
        tr.css 'cursor', 'default'
        tr.mouseover ->
          self.setSelectedResult i
        self.resultList.append tr
    
    @setSelectedResult 0
    
    @resultList.css {
      position: 'absolute'
      left:     0
      top:      @inputElement.height() + 5
      width:    @popupWidth || @inputElement.width() + 5
    }
    @resultList.show()

  @method 'cancelInput', ->
    # Method sometimes get called after view destroyed
    return if @_destroyed
    
    @resultList.hide()
    @mouseOverResults = false
    @trigger 'cancelled'
  
  @method 'selectResult', (result) ->
    # Method sometimes get called after view destroyed
    return if @_destroyed
    
    @resultList.hide()
    @results = null
    
    if @idInputElement
      @ignoreChange = true
      @inputElement[0].value = @helper.tag('div').append(result.label).text()
      @idInputElement.val result.id if result.id
    else
      @trigger 'selected', result
  
  @method 'selectResultWithText', (text) ->
    if @results
      for result in results
        if result.label.indexOf(text) >= 0
          @selectResult result
          return result
    null