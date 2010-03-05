STObject.subClass('STModel', {
    init: function()
    {
        this._super();
        this.changed = false;
        this.delegate = null;
    },
    
    delegate: ST.$property(),
    
    markChanged: function()
    {
        this.changed = true;
        if (this.delegate && this.delegate.modelChanged) {
            this.delegate.modelChanged(this);
        }
        this.trigger('changed');
    },
    
    _changed: function(member, oldValue, newValue)
    {
        this._super(member, oldValue, newValue);
        this.markChanged();
    },
    
    modelChanged: function(model)
    {
        this.markChanged();
    },
    
    arrayItemAdded: function(array, item)
    {
        item.setDelegate(this);
    },
    
end
:0});