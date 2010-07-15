STObject.subClass('STModel', {
    Index: {},
    NotFound: {},
    GenerateUUID: Math.uuid || (function() { return null; }),
    
    $find: function(uuid, callback)
    {
        var self = this;
        
        if (STModel.Index[uuid]) {
            callback(STModel.Index[uuid])
        } else if (this.FindUrl) {
            $.ajax({
                url:    this.FindUrl,
                type:   get,
                data:   {uuid: uuid},
                success: function(object) {
                    var model = self.createWithObject(object);
                    callback(model);
                }
            });
        } else {
            ST.error('No find URL for model: ' + self._name);
        }
    },
    
    $findNow: function(uuid)
    {
        if (STModel.Index[uuid]) {
            return STModel.Index[uuid];
        } else {
            return STModel.NotFound;
        }
    },
    
    $load: function(data)
    {
        var self = this;
        if (data instanceof Array) {
            $.each(data, function() {
                self.load(this);
            });
        } else {
            if (!(data && data.uuid)) return;
            if (STModel.Index[data.uuid]) return;
            this.createWithObject(data);
        }
    },
    
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