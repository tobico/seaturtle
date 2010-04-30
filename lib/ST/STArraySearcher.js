STSearcher.subClass('STArraySearcher', {
    
    initWithArray: function(array, labelCallback)
    {
        this.init();
        
        this.array = array;
        this.index = ':' + array.join(':') + ':';
        
        this.labelCallback = labelCallback;
    },
    
    search: function(term)
    {
        var self = this;
        this.setResults(
            ST.A(
                this.index.match(
                    new RegExp(':(.*' + term + '.*):', ['g', 'i'])
                )
            ).map(function(x) {
                return {
                    label:  self.labelCallback(x[1]),
                    value:  x[1]
                };
            })
        );
    },
    
end
:0});