STView.subClass('STAutoField', {
    //Mappings for event key code to result index
    KEY_CODES: { 49:0, 50:1, 51:2, 52:3, 53:4, 54:5, 55:6, 56:7, 57:8, 48:9, 190:10, 191:11, 97:0, 98:1, 99:2, 100:3, 101:4, 102:5, 103:6, 104:7, 105:8, 96:9, 110:10, 111:11 },
    //Mappings from result index to label for key
    KEY_LABELS: '1234567890./*-+'.split(''),
    
    init: function()
    {
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
    },
    
    delegate:       ST.$property,
    acceptsNull:    ST.$property,
    acceptsCustom:  ST.$property,
    inputElement:   ST.$property(null, 'readonly'),
    placeholder:    ST.$property,
    popupWidth:     ST.$property,
    resultsLimit:   ST.$property,

    destroy: function()
    {
        var self = this;
        this.searchers.each(function(searcher) {
            searcher.unbindAll(self);
        });
        this.searchers.release();
        this._super();
    },
    
    getLabel: function()
    {
        return this.label;
    },
    
    setLabel: function(label)
    {
        this.label = label;
        if (this.loaded) {
            this.labelElement.html(label);
        }
    },
    
    getValue: function()
    {
        return this.inputElement.val();
    },
    
    /**
     * Sets the current value (text) of input field.
     *
     * @param {String} value New value
     * @param {Boolean} performSearch Perform a search for new value.
     * (optional, default: false)
     */
    setValue: function(value, performSearch) {
        this.inputElement.val(value);
        if (performSearch && value && value != '') {
            this.labelElement.hide();
            this.performSearch(value);
        }
    },
    
    getName: function()
    {
        return this.name;
    },
    
    setName: function(name, value)
    {
        this.name = name;
        if (this.idInputElement) {
            this.idInputElement.attr('name', name);
        } else {
            this.idInputElement = ST.inputTag().attr({
                type: 'hidden',
                name: name,
                value:  value || null
            });
            this.getElement().append(this.idInputElement);
        }
    },
    
    addSearcher: function(searcher, options)
    {
        this.searchers.add(searcher);
        searcher.bind('resultsUpdated', this, 'searcherResultsUpdated');
        this.searcherOptions[searcher._uid] = options;
    },
    
    addAndReleaseSearcher: function(searcher, options)
    {
        this.addSearcher(searcher, options);
        searcher.release();
    },
    
    render: function(element)
    {
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
    },
    
    inputChanged: function()
    {
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
    },
    
    getSelectedResult: function()
    {
        if (!this.results) return null;
        return this.selectedResult;
    },
    
    setSelectedResult: function(x) {
        if (!this.results) return;
        
        if (this.results[this.selectedResult]) {
            this.results[this.selectedResult].tr.removeClass('active');
        }
        
        this.selectedResult = x;
        
        if (this.selectedResult < 0) {
            this.selectedResult = this.results.length - 1;
        }
        
        if (this.selectedResult >= this.results.length) {
            this.selectedResult = 0;
        }
        
        if (this.results[this.selectedResult]) {
            this.results[this.selectedResult].tr.addClass('active');
        }
    },
    
    inputKey: function(e)
    {
        e.stopPropagation();
        switch(e.which) {
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
        e.preventDefault();
    },
    
    focus: function()
    {
        if (!this.loaded) ST.error('Can\'t focus on AutoField until loaded');
        this.inputElement[0].focus();
        this.inputElement[0].select();
    },
    
    blur: function() {
        if (!this.loaded) ST.error('Can\'t blur AutoField until loaded');
        this.inputElement[0].blur();
    },
    
    focussed: function()
    {
        if (this.inputElement.val() == this.placeholder) {
            this.inputElement.val('').css('color', 'inherit');
        }
    },
    
    blurred: function()
    {
        if (this.mouseOverResults) {
            this.selectResult(this.results[this.selectedResult]);
        } else {
            if (this.inputElement.val() == '') {
                this.inputElement.val(this.placeholder).css('color', 'gray');
            }
            this.cancelInput();
        }
    },
    
    performSearch: function(term)
    {
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
    },
    
    searcherResultsUpdated: function(searcher)
    {
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
            this.results[this.searching] = newResults;
            this.showResults(this.searching, newResults);
            var oldTerm = this.searching;
            this.searching = false;
            var newTerm = this.getValue();
            if (newTerm.length && newTerm != oldTerm) {
                this.performSearch(newTerm);
            }
        }
    },
    
    showResults: function(term, results)
    {
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
    },

    cancelInput: function()
    {
        // Method sometimes get called after view destroyed
        if (this._destroyed) return;
                
        this.resultList.hide();
        this.mouseOverResults = false;
        if (this.delegate && this.delegate.autoFieldCancelled) {
            this.delegate.autoFieldCancelled(this);
        }
    },
    
    selectResult: function(result)
    {
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
    },
    
    selectResultWithText: function(text)
    {
        for (var i = 0; this.results[i]; i++) {
            if (this.results[i].label.indexOf(text) >= 0) {
                this.selectResult(this.results[i]);
                return this.results[i];
            }
        }
        return null;
    },
end
:0});

$.fn.STAutoField = function(searcher, acceptsNull)
{
    return this.each(function() {
        var tag = $(this);
        var field = STAutoField.create();
        if (acceptsNull) {
            field.setAcceptsNull(true);
            field.setPlaceholder('None');
        }
        field.load();
        field.getInputElement().attr('style', '')
        field.addSearcher(searcher);
        if (tag.attr('name')) field.setName(tag.attr('name'), tag.val());
        var label = tag.attr('data-label');
        if (label && label != '') {
            field.inputElement.val(tag.attr('data-label'));
        } else if (acceptsNull) {
            field.inputElement.val('None').css('color', 'gray');
        }
        tag.replaceWith(field.getElement());
    });
};