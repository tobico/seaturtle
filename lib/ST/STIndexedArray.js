STManagedArray.subClass('STIndexedArray', {
	
    add: function(o)
    {
        //Index object
        o.index = this.array.length;
        
        //Link previous neighbor
        o.prev = this.last();
        if (o.prev) o.prev.next = o;
        
        //Link next neighbor to null
        o.next = null;
        
        this._super(o);
    },
    
    insertObjectAtIndex: function(o, index)
    {
        //If index is greater than last item, add to end
        if (index >= this.length) {
            this.add(o);
            return;
        }
        
        //If index is negative, choose index counting backward from end
        if (index < 0) {
            index += this.length;
        }
        
        //If negative index is greater than array length, choose first item
        if (index < 0) {
            index = 0;
        }
        
        //Retain and number object
        o.index = index;
        
        //Link object to previous neighbor, or null if inserting at beginning
        if (index == 0) {
            o.prev = null;
        } else {
            o.prev = this.objectAtIndex(index - 1);
            o.prev.next = o;
        }
        
        //Link object to next neighbor
        o.next = this.objectAtIndex(index);
        o.next.prev = o;
        
        //Insert object into array
        this.array.splice(index, 0, o.retain());
        
        //Update object indexes
        this.renumber(index);
        
        //Notify delegate of insertion
        if (this.delegate && this.delegate.arrayItemAdded) {
            this.delegate.arrayItemAdded(this, o);
        }
        this.trigger('itemAdded', o);
    },
	
    /**
     * Removes item in array with specified index
     */
    removeAtIndex: function(index)
    {
        //Check that object exists at index
        if (!this.array[index]) return false;
        
        if (index == this.lastIndex()) {
            return this.removeLast();
        }
        
        var o = this.array[index];
        
        if (o.prev && o.next) {
            o.prev.next = o.next;
            o.next.prev = o.prev;
        } else if (o.next) {
            o.next.prev = null;
        }
        
        //Remove object
        this.array.splice(index, 1);
        
        //Renumber following objects
        this.renumber(index);
        
        //Notify delegate
        if (this.delegate && this.delegate.arrayItemRemoved) {
            this.delegate.arrayItemRemoved(this, o);
        }
        this.trigger('itemRemoved', o);
       
        //Release object
        o.release();
        
        return true;
    },
	
	removeLast: function()
    {
        if (!this.array.length) return false;
        
        var o = this.last();
        
        if (o.prev) {
            o.prev.next = null;
        }
        
        return this._super();
    },
    
    sort: function(callback)
    {
    	this._super(callback).renumber().relink();
    },
    
    renumber: function(start)
    {
        for (var i = start || 0; i < this.array.length; i++) {
            this.array[i].index = i;
        }
    },
    
    relink: function()
    {
        for (var i = 0; i < this.array.length; i++) {
            this.array[i].prev = this.objectAtIndex(i-1);
            this.array[i].next = this.objectAtIndex(i+1);
        }
    },
	
end
:0});