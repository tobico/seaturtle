STSearcher.subClass('STArraySearcher', {
    
    initWithArray: function(array)
    {
        this.init();
        
        this.array = array;
        this.index = ':' + array.join(':') + ':';
        
        this.labelCallback = labelCallback;
        this.selectCallback = selectCallback;
    },
    
    search: function(term)
    {
        var self = this;
        
        if (!(this.delegate && this.delegate.searcherFoundResult)) return;
        
        var matches = this.index.match(new RegExp(':(.*' + term + '.*):', ['g', 'i']));
        for (var i = 0; i < matches.length; i++) {
            self.delegate.searcherFoundResult(self, matches[i][1]);
        }
    },
    
end
:0});