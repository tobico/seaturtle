STSearcher.subClass('STCollectionSearcher', {
    
    initWithCollection: function(collection, callback)
    {
        this.init();
        
        this.setCollection(collection);
        
        this.callback = callback
        
        this.buildIndex();
    },
    
    collection, ST.$property('retain'),
    needsRebuild: ST.$property(),
    
    setCollection: function(collection)
    {
        if (this.collection == collection) return;
        if (this.collection) {
            this.collection.unbindAll(this).release();;
        }
        this.collection = collection;
        if (collection) {
            collection.retain()
                .bind('itemAdded', this, 'collectionItemAdded')
                .bind('itemRemoved', this, 'collectionItemRemoved');
        }
    },
    
    buildIndex: function()
    {
        this.needsRebuild = false;
        
        var self = this;
        
        this.itemsByLabel = {};
        
        var index = STArray.create();
        collection.each(function(item) {
            var label = self.callback(item, function(x) { return x; });
            index.push(label);
            self.itemsByLabel[label] = item;
        });
        this.indexString = ':' + index.join(':') + ':';
    },
    
    search: function(term)
    {    
        if (this.needsRebuild) this.buildIndex();
        
        var self = this;
        var exp = new RegExp(':([^:]*?' + ST.reEscape(term) + '[^:]*)', 'gi');
        var match;
        var results = ST.A();
        while ((match = exp.exec(this.indexString)) != null) {
            results.push(self.callback(
                self.itemsByLabel[match[1]],
                function(text) { return self.hilight(text, self.split ? term.split(' ') : term); })
            );
        }
        this.setResults(results);
    },
    
    collectionItemAdded: function(array, item)
    {
        this.needsRebuild = true;
    },

    collectionItemRemoved: function(array, item)
    {
        this.needsRebuild = true;
    },
    
end
:0});