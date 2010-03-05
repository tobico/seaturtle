STObject.subClass('STManagedArray', {
    init: function()
    {
        this._super();
        this.array = new STArray();
        this.delegate = null;
    },
    
    delegate: ST.$property('retain'),
    
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
    
    has:             ST.$forward('array'),
    each:            ST.$forward('array'),
    any:             ST.$forward('array'),
    all:             ST.$forward('array'),
    find:            ST.$forward('array'),
    sort:            ST.$forward('array'),
    mapToArray:      ST.$forward('array', 'map'),
    mapToStdArray:   ST.$forward('array'),
    
    indexOfObject: function(o)
    {
        var i = this.array.indexOf(o);
        return i >= 0 ? i : null;
    },
    
    count: function()
    {
        return this.array.length;
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
        if (!o.retain) this.error('Tried to add a non-managed object to an STManagedArray');
        
        //Retain object and add to array
        this.array.push(o.retain());
        
        //Notify delegate of addition
        if (this.delegate && this.delegate.arrayItemAdded) {
            this.delegate.arrayItemAdded(this, o);
        }
    },
    
    insertObjectAtIndex: function(o, index)
    {
        //Insert object into array
        this.array.splice(index, 0, o.retain());
        
        //Notify delegate of insertion
        if (this.delegate && this.delegate.arrayItemAdded) {
            this.delegate.arrayItemAdded(this, o);
        }
    },
    
    addAndRelease: function(o)
    {
        this.add(o);
        o.release();
    },
    
    remove: function(o)
    {
        return this.removeAtIndex(this.array.indexOf(o));
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
       
        //Release object
        o.release();
        
        return true;
    },
    
    removeLast: function()
    {
        if (!this.array.length) return false;
        
        var o = this.last();
        
        this.array.pop();
        
        //Notify delegate
        if (this.delegate && this.delegate.arrayItemRemoved) {
            this.delegate.arrayItemRemoved(this, o);
        }
        
        o.release();
        
        return true;
    },
    
    copy: function()
    {
        var a = this.$.create();
        this.array.each(function(o) { a.add(o); });
        return a;
    },
    
    empty: function()
    {
        //Notify delegate
        if (this.delegate && this.delegate.arrayItemRemoved) {
            var self = this;
            
            this.array.each(function(o) {
                self.delegate.arrayItemRemoved(self, o);
            })
            
        }
        
        this.array.releaseAndEmpty();
    },
    
end
:0});