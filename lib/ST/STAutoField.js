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
        this.results = {};
        this.delegate = null;
        this.acceptsNull = false;
        this.acceptsCustom = true;
        this.mouseOverResults = false;
        this.popupWidth = null;
        this.resultsLimit = 9;
    },
    
    delegate:       ST.$property,
    acceptsNull:    ST.$property,
    acceptsCustom:  ST.$property,
    inputElement:   ST.$property(null, 'readonly'),
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
    
    setValue: function(value) {
        this.inputElement.val(value);
    },
    
    getName: function()
    {
        return this.name;
    },
    
    setName: function(name)
    {
        this.name = name;
        if (this.idInputElement) {
            this.idInputElement.attr('name', name);
        } else {
            this.idInputElement = ST.inputTag().attr({
                type: 'hidden',
                name: name
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
            this.currentResults = false;
        }
    },
    
    getSelectedResult: function()
    {
        if (!this.currentResults) return null;
        return this.selectedResult;
    },
    
    setSelectedResult: function(x) {
        if (!this.currentResults) return;
        
        if (this.currentResults[this.selectedResult]) {
            this.currentResults[this.selectedResult].tr.removeClass('active');
        }
        
        this.selectedResult = x;
        
        if (this.selectedResult < 0) {
            this.selectedResult = this.currentResults.length - 1;
        }
        
        if (this.selectedResult >= this.currentResults.length) {
            this.selectedResult = 0;
        }
        
        if (this.currentResults[this.selectedResult]) {
            this.currentResults[this.selectedResult].tr.addClass('active');
        }
    },
    
    inputKey: function(e)
    {
        e.stopPropagation();
        switch(e.which) {
            case 38: //UP
                if (!this.currentResults) break;
                this.setSelectedResult(this.selectedResult - 1);
                break;
            case 40: //DOWN
                if (!this.currentResults) break;
                this.setSelectedResult(this.selectedResult + 1);
                break;
            case 13: //ENTER
                
                if (this.currentResults) {
                    this.selectResult(this.currentResults[this.selectedResult]);
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
                if (this.currentResults.length) {
                    this.selectResult(
                        this.currentResults[this.selectedResult]
                    );
                    break;
                } else {
                    return;
                }
            default:
                if (STAutoField.KEY_CODES[e.which] !== undefined) {
                    var n = STAutoField.KEY_CODES[e.which];
                    if (this.currentResults && this.currentResults[n]) {
                        this.selectResult(this.currentResults[n]);
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
    
    blurred: function()
    {
        if (this.mouseOverResults) {
            this.selectResult(this.currentResults[this.selectedResult]);
        } else {
            this.cancelInput();
        }
    },
    
    performSearch: function(term)
    {
        var self = this;
        
        if (this.results[term]) {
            this.showResults(term, this.results[term])
            return;
        }
        
        if (this.searching) return;
        
        this.searching = term;
        this.searchersStillSearching = this.searchers.toArray();
        
        this.results[term] = STArray.create();
        
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

        this.currentResults = results;
        this.searchValue = term;
        
        if (!results.length) {
            this.currentResults = false;
            self.resultList.hide();
            return;
        }
        
        if (results.length > this.resultsLimit) {
            results.splice(this.resultsLimit);
        }
        
        this.resultList.empty();
        results.each(function(result, i) {
            self.currentResults[i].tr = ST.trTag(
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
        this.mouseOverResults = false;
        if (this.delegate && this.delegate.autoFieldCancelled) {
            this.delegate.autoFieldCancelled(this);
        }
        this.resultList.hide();
    },
    
    selectResult: function(result)
    {
        this.resultList.hide();
        if (this.delegate && this.delegate.autoFieldSelectedResult) {
            this.delegate.autoFieldSelectedResult(this, result);
        } else {
            this.ignoreChange = true;
            this.inputElement[0].value = ST.divTag(result.label).text();
            if (this.idInputElement && result.id) {
                this.idInputElement.val(result.id);
            }
        }
    },
end
:0});

$.fn.STAutoField = function(searcher)
{
    return this.each(function() {
        var tag = $(this);
        var field = STAutoField.create();
        field.load();
        field.getInputElement().attr('style', '')
        field.addSearcher(searcher);
        if (tag.attr('name')) field.setName(tag.attr('name'));
        if (tag.attr('data-label')) {
            field.inputElement.val(tag.attr('data-label'));
        }
        tag.replaceWith(field.getElement());
    });
};