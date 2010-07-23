STSearcher.subClass('STModelSearcher', {
    
    initWithModelUrl: function(model, url, labelMethod)
    {
        this.init();
        
        this.model = model;
        this.url = url;
        this.labelMethod = labelMethod || 'label';
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
        $.each(data, function()
        {
            if (!STModel.Index[this.uuid]) {
                STModel.unserialize(this);
            }
            this.model = STModel.Index[this.uuid]
            
            this.textLabel = this.model.get(self.labelMethod);
            if (this.textLabel) {
                this.label = self.hilight(this.textLabel, self.split ? term.split(' ') : term);
            }
            results.push(this);
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