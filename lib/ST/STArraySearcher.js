STSearcher.subClass('STArraySearcher', {
    
    setArray: function(array)
    {
        var self = this;
        
        this.array = array;
        this.itemsByLabel = {};
        
        var index = STArray.create();
        array.each(function(item) {
            index.push(item.label);
            self.itemsByLabel[item.label] = item;
        });
        this.indexString = ':' + index.join(':') + ':';
    },
    
    search: function(term)
    {    
        var self = this;
        var exp = new RegExp(':([^:]*?' + ST.reEscape(term) + '[^:]*)', 'gi');
        var match;
        var results = ST.A();
        while ((match = exp.exec(this.indexString)) != null) {
            results.push(self.itemsByLabel[match[1]]);
        }
        this.setResults(results);
    },
        
end
:0});