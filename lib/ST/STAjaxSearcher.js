STSearcher.subClass('STAjaxSearcher', {
    
    initWithUrl: function(url, callback)
    {
        this.init();
        
        this.url = url;
        this.callback = callback;
        this.async = true;
        this.split = true;
        this.minLength = 3;
        this.cache = {};
    },
    
    minLength: ST.$property,
    
    search: function(term)
    {
        var self = this;
        
        this.searching = true;
        
        if (term.length < this.minLength) {
            this.clearResults();
        } else if (this.cache[term]) {
            this.setResults(this.cache[term]);
        } else {        
            $.ajax({
                url: this.url,
                method: 'get',
                dataType: 'json',
                data: {q: term},
                success: function(data) { self.succeeded(term, data); },
                error:  this.methodFn('failed')
            });
        }
    },
    
    succeeded: function(term, data)
    {
        var self = this;
        
        var results = STArray.create();
        $.each(data, function() {
            if (this.label) {
                this.label = self.hilight(this.label, self.split ? term.split(' ') : term);
            }
            if (self.callback) {
                results.push(self.callback(this, function(text) { return self.hilight(text, self.split ? term.split(' ') : term); }));
            } else {
                results.push(this);
            }
        });
        this.cache[term] = results;
        this.setResults(results);
    },
    
    failed: function()
    {
        this.setResults(ST.A());
    },
    
end
:0});