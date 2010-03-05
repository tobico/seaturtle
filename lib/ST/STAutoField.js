STView.subClass('STAutoField', {
    
    init: function()
    {
        this._super();
        this.searchers = STManagedArray.create();
        this.element.addClass('STAutoField');
        this.label = '';
        this.inputElement = this.labelElement = null;
        this.searching = false;
        this.searchValue = '';
        this.results = {};
        this.delegate = null;
        this.acceptsNull = false;
        this.acceptsCustom = true;
    },
    
    delegate:       ST.$property,
    acceptsNull:    ST.$property,
    acceptsCustom:  ST.$property,
    inputElement:   ST.$property(null, 'readonly'),
    
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
        this.inputChanged()
    },
    
    destroy: function()
    {
        this.searchers.release();
        this._super();
    },
    
    addSearcher: function(searcher)
    {
        this.searchers.add(searcher);
    },
    
    addAndReleaseSearcher: function(searcher)
    {
        this.addSearcher(searcher);
        searcher.release();
    },
    
    render: function(element)
    {
        this._super(element);
        
        var id = 'STAutoFieldInput' + this._uid;
        
        this.inputElement = ST.inputTag().attr('id', id).css({
            width: '100%'
        }).keyup(this.methodFn('inputChanged'))
          .keydown(this.methodFn('inputKey'))
          .blur(this.methodFn('cancelInput'))
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
        
        this.resultList = ST.tableTag().hide().appendTo(element);
    },
    
    inputChanged: function()
    {
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
        //log(e.which);
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
            case 49: //Number 1
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57: //Number 9
                var n = e.which - 49;
                if (this.currentResults && this.currentResults[n]) {
                    this.selectResult(this.currentResults[n]);
                }
                break;
            case 97: //Number pad 1
            case 98:
            case 99:
            case 100:
            case 101:
            case 102:
            case 103:
            case 104:
            case 105: //Number pad 9
                var n = e.which - 97;
                if (this.currentResults && this.currentResults[n]) {
                    this.selectResult(this.currentResults[n]);
                }
                break;            
            case 27:
                this.cancelInput();
                break;
            default:
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
    
    performSearch: function(term)
    {
        var self = this;
        
        if (this.results[term]) {
            this.showResults(term, this.results[term])
            return;
        }
        
        if (this.searching) return;
        
        this.searching = term;
        
        this.results[term] = STArray.create();
        
        this.searchers.each(function(searcher) {
            searcher.setDelegate(self).search(term);
        });
        
        if (!this.searchers.any(ST.P('async'))) {
            this.showResults(this.searching, this.results[this.searching]);
            this.searching = false;
        }
    },
    
    searcherFoundResult: function(searcher, result)
    {
        if (!this.searching) return;
        
        this.results[this.searching].push(result);
    },
    
    searcherFinishedSearching: function(searcher)
    {
        if (!this.searchers.any(ST.P('searching'))) {
            this.showResults(this.searching, this.results[this.searching]);
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
        
        if (!results.length) {
            this.currentResults = false;
            self.resultList.hide();
            return;
        }
        
        if (results.length > 9) {
            results.splice(9);
        }
        
        this.currentResults = results;
        this.searchValue = term;
        
        this.resultList.empty();
        results.each(function(result, i) {
            self.currentResults[i].tr = ST.trTag(
                ST.tdTag(i+1),
                ST.tdTag(result.label)
            ).appendTo(self.resultList);
        });
        
        this.setSelectedResult(0);
        
        self.resultList.css({
            position: 'absolute',
            left: 5,
            top: self.inputElement.height() + 5
        }).show();
    },

    cancelInput: function()
    {
        if (this.delegate && this.delegate.autoFieldCancelled) {
            this.delegate.autoFieldCancelled(this);
        }
    },
    
    selectResult: function(result)
    {
        this.resultList.hide();
        if (this.delegate && this.delegate.autoFieldSelectedResult) {
            this.delegate.autoFieldSelectedResult(this, result);
        }
    },
end
:0});
