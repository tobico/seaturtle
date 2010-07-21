STObject.subClass('STList', {
    init: function()
    {
        this._super();
        this.array = new STArray();
        this.delegate = null;
    },
    
    delegate:       ST.$property('retain'),
    has:            ST.$forward('array'),
    each:           ST.$forward('array'),
    any:            ST.$forward('array'),
    all:            ST.$forward('array'),
    find:           ST.$forward('array'),
    sort:           ST.$forward('array'),
    map:            ST.$forward('array'),
    mapToStdArray:  ST.$forward('array'),
    toArray:        ST.$forward('array', 'copy'),
    toStdArray:     ST.$forward('array'),
    collect:        ST.$forward('array'),
    reject:         ST.$forward('array'),
    
    destroy: function()
    {
        this.setDelegate(null);
        this.array.releaseAndEmpty();
        this._super();
    },
    
    objectAtIndex: function(index)
    {
        return this.array[Number(index)] || null;
    },
    
    setObjectAtIndex: function(index, o)
    {
        this.array[Number(index)] = o;
    },
    
    findObjectByProperty: function(property, value)
    {
        for (var i = 0; i < this.array.length; i++) {
            if (this.array[i] && this.array[i][property] == value) {
                return this.array[i];
            }
        }
        return null;
    },
    
    indexOfObject: function(o)
    {
        var i = this.array.indexOf(o);
        return i >= 0 ? i : null;
    },
    
    count: function()
    {
        return this.array.length;
    },
    
    isEmpty: function()
    {
        return this.array.length == 0;
    },
    
    first: function()
    {
        if (!this.array.length) return null;
        return this.array[0];
    },
    
    last: function()
    {
        if (!this.array.length) return null;
        return this.array[this.lastIndex()];
    },
    
    lastIndex: function()
    {
        return this.array.length-1;
    },
    
    add: function(o)
    {   
        if (o.retain) o.retain();
        
        //Retain object and add to array
        this.array.push(o);
        
        //Notify delegate of addition
        if (this.delegate && this.delegate.arrayItemAdded) {
            this.delegate.arrayItemAdded(this, o);
        }
        this.trigger('itemAdded', o);
    },
    
    insertObjectAtIndex: function(o, index)
    {
        //Insert object into array
        this.array.splice(index, 0, o.retain());
        
        //Notify delegate of insertion
        if (this.delegate && this.delegate.arrayItemAdded) {
            this.delegate.arrayItemAdded(this, o);
        }
        this.trigger('itemAdded', o);
    },
    
    addAndRelease: function(o)
    {
        this.add(o);
        if (o.release) o.release();
    },
    
    /**
     * Removes item in array with specified index
     */
    removeAtIndex: function(index)
    {
        //Check that object exists at index
        if (this.array[index] === undefined) return false;
        
        //Remove object
        var o = this.array.splice(index, 1)[0];
        
        //Notify delegate
        if (this.delegate && this.delegate.arrayItemRemoved) {
            this.delegate.arrayItemRemoved(this, o);
        }
        this.trigger('itemRemoved', o);
       
        //Release object
        if (o.release) o.release();
        
        return true;
    },
    
    removeLast: function()
    {
        if (!this.array.length) return false;
        
        var o = this.array.pop();
        
        //Notify delegate
        if (this.delegate && this.delegate.arrayItemRemoved) {
            this.delegate.arrayItemRemoved(this, o);
        }
        this.trigger('itemRemoved', o);
        
        if (o.release) o.release();
        
        return true;
    },

    remove: function(o)
    {
        return this.removeAtIndex(this.array.indexOf(o));
    },
    
    copy: function()
    {
        var a = this.$.create();
        this.array.each(function(o) { a.add(o); });
        return a;
    },
    
    empty: function()
    {
        var self = this;
        this.array.each(function(o) {
            //Notify delegate
            if (self.delegate && self.delegate.arrayItemRemoved) {
                self.delegate.arrayItemRemoved(self, o);
            }
            self.trigger('itemRemoved', o);
        });
        this.array.releaseAndEmpty();
    },
    
end
:0});