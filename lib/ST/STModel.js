STObject.subClass('STModel', {
    GenerateUUID: Math.uuid || (function() { return null; }),

    init: function()
    {
        this._super();
        this.changed = false;
        this.delegate = null;
        this.uuid = STModel.GenerateUUID();
    },
    
    delegate:   ST.$property,
    id:         ST.$property,
    uuid:       ST.$property,
    
    resetId: function()
    {
        this.id = null;
        this.uuid = STModel.GenerateUUID();
    },
    
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
        // console.log(this + '.' + member + ' changed from "' + oldValue + '" to ""' + newValue + '""');
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