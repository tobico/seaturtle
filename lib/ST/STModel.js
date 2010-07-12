STObject.subClass('STModel', {
    Index: {},
    GenerateUUID: Math.uuid || (function() { return null; }),
    
    init: function()
    {
        this._super();
        this.changed = false;
        this.delegate = null;
        this.setUuid(STModel.GenerateUUID());
    },
    
    delegate:   ST.$property,
    id:         ST.$property,
    uuid:       ST.$property,
    
    resetId: function()
    {
        this.id = null;
        this.uuid = STModel.GenerateUUID();
    },
    
    setUuid: function(newUuid)
    {
        if (STModel.Index[newUuid]) return;
        delete STModel.Index[this.uuid];
        this.uuid = newUuid;
        STModel.Index[this.uuid] = this;
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

STModel.$assocOne = {_generator: function(f, member)
{
    var ucMember = ST.ucFirst(member);
    f.prototype['get' + ucMember] = function() {
        var uuid = this.get(member + 'Uuid')
        if (uuid && STModel.Index[uuid]) {
            return STModel.Index[uuid]
        } else {
            return null;
        }
    };
    f.prototype['set' + ucMember] = function(object) {
        this.set(member + 'Uuid', object && object.uuid);
    };
}};