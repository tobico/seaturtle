ST.class 'AutoField', 'View', ->
  # Mappings for event key code to result index
  @KEY_CODES = { 49:0, 50:1, 51:2, 52:3, 53:4, 54:5, 55:6, 56:7, 57:8, 48:9, 190:10, 191:11, 97:0, 98:1, 99:2, 100:3, 101:4, 102:5, 103:6, 104:7, 105:8, 96:9, 110:10, 111:11 },
  
  # Mappings from result index to label for key
  @KEY_LABELS = '1234567890./*-+'.split('')
  
  @constructor ->
    this._super();
    this.searchers = STList.create();
    this.searcherOptions = {}
    this.element.addClass('STAutoField');
    this.label = '';
    this.inputElement = this.labelElement = this.idInputElement = null;
    this.name = null;
    this.searching = false;
    this.searchValue = '';
    this.results = null;
    this.delegate = null;
    this.acceptsNull = false;
    this.acceptsCustom = true;
    this.mouseOverResults = false;
    this.popupWidth = null;
    this.placeholder = '';
    this.resultsLimit = 9;
  
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
    this.searchers.each(function(searcher) {
        searcher.unbindAll(self);
    });
    this.searchers.release();
    this._super();
  
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
    this.searchers.add(searcher);
    searcher.bind('resultsUpdated', this, 'searcherResultsUpdated');
    this.searcherOptions[searcher._uid] = options;
  
  @method 'addAndReleaseSearcher', (searcher, options) ->
    this.addSearcher(searcher, options);
    searcher.release();
  
  @method 'render', (element) ->
    this._super(element);
    
    var self = this
    
    var id = 'STAutoFieldInput' + this._uid;
    
    this.inputElement = ST.inputTag().attr({
        id:             id,
        autocomplete:   'off'
    }).addClass('text').css({
        width: '100%'
    }).keyup(this.methodFn('inputChanged'))
      .keydown(this.methodFn('inputKey'))
      .focus(this.methodFn('focussed'))
      .blur(this.methodFn('blurred'))
      .attr('autocomplete', 'off')
      .appendTo(ST.divTag().css({
        overflow: 'hidden',
        'padding-right': '6px'
      }).appendTo(element));
    
    this.labelElement = ST.labelTag(this.label).attr('for', id).css({
        position: 'absolute',
        left: '5px',
        top: '3px',
        color : '#666',
        cursor: 'text'
    }).appendTo(element);
    
    this.resultList = ST.tableTag().hide().hover(function() {
        self.mouseOverResults = true;
    }, function() {
        self.mouseOverResults = false;
    }).addClass('STAutoFieldResults').appendTo(element);
  
  @method 'inputChanged', ->
    if (this.ignoreChange) {
        this.ignoreChange = false;
        return;
    }
    var s = this.inputElement.val();
  
    if (s.length > 0) {
        if (s == this.searchValue) return;
      
        this.labelElement.hide();
        this.performSearch(s);
    } else {
        this.labelElement.show();
        this.resultList.hide();
        this.results = null;
        if (this.idInputElement && this.acceptsNull) {
            this.idInputElement.val('');
        }
    }
  
  @method 'getSelectedResult', ->
    if (!this.results) return null;
    return this.selectedResult;
  
  @method 'setSelectedResult', (newSelectedResult) ->
    if (!this.results) return;
    
    if (this.results[this.selectedResult]) {
        this.results[this.selectedResult].tr.removeClass('active');
    }
    
    this.selectedResult = newSelectedResult;
    
    if (this.selectedResult < 0) {
        this.selectedResult = this.results.length - 1;
    }
    
    if (this.selectedResult >= this.results.length) {
        this.selectedResult = 0;
    }
    
    if (this.results[this.selectedResult]) {
        this.results[this.selectedResult].tr.addClass('active');
    }
  
  @method 'inputKey', (event) ->
    event.stopPropagation();
    switch(event.which) {
        case 38: //UP
            if (!this.results) break;
            this.setSelectedResult(this.selectedResult - 1);
            break;
        case 40: //DOWN
            if (!this.results) break;
            this.setSelectedResult(this.selectedResult + 1);
            break;
        case 13: //ENTER
            
            if (this.results) {
                this.selectResult(this.results[this.selectedResult]);
            } else {
                var val = this.getValue();
                if (val == '' && this.acceptsNull) {
                    this.selectResult(null);
                } else if (val != '' && this.acceptsCustom) {
                    this.selectResult({custom: val});
                } else {
                    this.cancelInput();
                }
                break;
            }
            break;
        case 27: //Escape
            this.cancelInput();
            break;
        case 9: //Tab
            if (this.results && this.results.length) {
                this.selectResult(
                    this.results[this.selectedResult]
                );
                break;
            } else {
                return;
            }
        default:
            if (STAutoField.KEY_CODES[e.which] !== undefined) {
                var n = STAutoField.KEY_CODES[e.which];
                if (this.results && this.results[n]) {
                    this.selectResult(this.results[n]);
                }
                break;
            }
            return;
    }
    event.preventDefault()
  
  @method 'focus', ->
    if (!this.loaded) ST.error('Can\'t focus on AutoField until loaded');
    this.inputElement[0].focus();
    this.inputElement[0].select();
  
  @method 'blur', ->
    if (!this.loaded) ST.error('Can\'t blur AutoField until loaded');
    this.inputElement[0].blur();
  
  @method 'focused', ->
    if (this.inputElement.val() == this.placeholder) {
        this.inputElement.val('').css('color', 'inherit');
    }
  
  @method 'blurred', ->
    if (this.mouseOverResults) {
        this.selectResult(this.results[this.selectedResult]);
    } else {
        if (this.inputElement.val() == '') {
            this.inputElement.val(this.placeholder).css('color', 'gray');
        }
        this.cancelInput();
    }
  
  @method 'performSearch', (term) ->
    var self = this;
    
    if (this.searching) {
        if (this.searching == term) return;
        
        //Todo: Cancel search and start new search
        return;
    }
    
    this.searching = term;
    this.searchersStillSearching = this.searchers.toArray();
    
    this.results = STArray.create();
    
    this.searchers.each(function(searcher) {
        searcher.search(term);
    });
  
  @method 'searcherResultsUpdated', (searcher) ->
    var self = this;
    if (!this.searching) return;
    this.searchersStillSearching.remove(searcher);
    if (this.searchersStillSearching.length == 0) {
        var newResults = ST.A();
        this.searchers.each(function(searcher) {
            var acceptResults = self.resultsLimit - newResults.length;
            var searcherOptions = self.searcherOptions[searcher._uid]||{};
            if (searcherOptions.limit) {
                acceptResults = Math.min(
                    searcherOptions.limit, acceptResults
                );
            }
            searcher.results.each(function(result) {
                newResults.push(result);
                acceptResults--;
                if (acceptResults == 0) return 'break';
            });
            if (newResults.length >= self.resultsLimit) return 'break';
        });
        this.results = newResults;
        this.showResults(this.searching, newResults);
        var oldTerm = this.searching;
        this.searching = false;
        var newTerm = this.getValue();
        if (newTerm.length && newTerm != oldTerm) {
            this.performSearch(newTerm);
        }
    }
  
  @method 'showResults', (term, results) ->
    var self = this;

    this.results = results.length && results;
    this.searchValue = term;
    
    if (!this.results) {
        self.resultList.hide();
        STAutoField.Active = null;
        return;
    }
    
    STAutoField.Active = this;
    
    if (results.length > this.resultsLimit) {
        results.splice(this.resultsLimit);
    }
    
    this.resultList.empty();
    results.each(function(result, i) {
        self.results[i].tr = ST.trTag(
            ST.tdTag(STAutoField.KEY_LABELS[i]).addClass('hotkey'),
            ST.tdTag(result.label)
        ).css('cursor', 'default').mouseover(function() {
            self.setSelectedResult(i);
        }).appendTo(self.resultList);
    });
    
    this.setSelectedResult(0);
    
    self.resultList.css({
        position: 'absolute',
        left: 0,
        top: self.inputElement.height() + 5,
        width: self.popupWidth || (self.inputElement.width() + 5)
    }).show();

  @method 'cancelInput', ->
    // Method sometimes get called after view destroyed
    if (this._destroyed) return;
            
    this.resultList.hide();
    this.mouseOverResults = false;
    if (this.delegate && this.delegate.autoFieldCancelled) {
        this.delegate.autoFieldCancelled(this);
    }
  
  @method 'selectResult', (result) ->
    // Method sometimes get called after view destroyed
    if (this._destroyed) return;
    
    this.resultList.hide();
    this.results = null;
    
    if (this.delegate && this.delegate.autoFieldSelectedResult) {
        this.delegate.autoFieldSelectedResult(this, result);
    } else if (this.idInputElement) {
        this.ignoreChange = true;
        this.inputElement[0].value = ST.divTag(result.label).text();
        if (result.id) {
            this.idInputElement.val(result.id);
        }
    }
  
  @method 'selectResultWithText', (text) ->
    if (this.results) {
        for (var i = 0; this.results[i]; i++) {
            if (this.results[i].label.indexOf(text) >= 0) {
                var result = this.results[i]
                this.selectResult(result);
                return result;
            }
        }
    }
    return null;