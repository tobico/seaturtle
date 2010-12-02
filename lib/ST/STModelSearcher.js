STSearcher.subClass('STModelSearcher', {
    
    initWithModelUrl: function(model, url, labelField)
    {
        this.init();
        
        this.model = model;
        this.url = url;
        this.labelField = labelField || 'label';
        this.async = true;
        this.split = true;
        this.minLength = 3;
        this.cacheMinutes = 2;
        this.cache = {};
        window.c = this.cache;
    },
    
    minLength: ST.$property,
    
    search: function(term)
    {
        var self = this;
        
        this.searching = true;
        
        //Convert term to lowercase to compare
        var lcTerm = term.toLowerCase();
        
        //Expire cache
        var now = new Date;
        if (this.cache[lcTerm] && this.cache[lcTerm].expires <= now) {
            delete this.cache[lcTerm];
        }
        
        if (term.length < this.minLength) {
            this.clearResults();
        } else if (this.cache[lcTerm]) {
            this.setResults(this.cache[lcTerm].results);
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
        if (data && data.length) {
            $.each(data, function()
            {
                //Load model data
                STModel.createWithData(this, {temporary: true});
                
                //Don't add object to results list if it's for another model
                if (this._model != self.model._name) return;
                
                this.model = STModel.Index[this.uuid];
                this.label = this.model.get(self.labelField);
                
                results.push(this);
            });
        }
        
        //Save result in cache
        this.cache[term.toLowerCase()] = {
            results: results,
            expires: this.cacheMinutes.minutes().fromNow()
        };
        
        this.setResults(results);
    },
    
    failed: function()
    {
        this.setResults(ST.A());
    },
    
end
:0});