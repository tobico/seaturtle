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
            this.sendDone();
        } else if (this.cache[term]) {
            this.sendResults(this.cache[term]);
            this.sendDone();
        } else {        
            $.ajax({
                url: this.url,
                method: 'get',
                data: {q: term},
                success: function(data) { self.succeeded(term, data); },
                error:  this.methodFn('failed')
            });
        }
    },
    
    succeeded: function(term, data)
    {
        var self = this;
        
        var a;
        try {
            a = JSON.parse(data);
        } catch (e) {
            this.sendDone();
            return;
        }
        var results = STArray.create();
        $.each(a, function() {
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
        this.sendResults(results)
        this.sendDone();
    },
    
    failed: function()
    {
        this.sendDone();
    },
    
    sendResults: function(results)
    {
        var self = this;
        
        results.each(function() {
            if (self.delegate && self.delegate.searcherFoundResult) {
                self.delegate.searcherFoundResult(self, this);
            }
        });
    },
    
    sendDone: function()
    {
        this.searching = false;
        if (this.delegate && this.delegate.searcherFinishedSearching) {
            this.delegate.searcherFinishedSearching(this);
        }
    },
    
end
:0});