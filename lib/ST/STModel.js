STObject.subClass('STModel', {
    Index: {},
    NotFound: {},
    GenerateUUID: Math.uuid || (function() { return null; }),
    
    $fetch: function(uuid, callback)
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
    
    $matches: function(object, conditions)
    {
        for (var key in conditions) {
            if (object[key] != conditions[key]) return false;
        }
        return true;
    },
    
    $find: function(mode, options)
    {
        if (!options) options = {};
        
        if (mode == 'first') {
            if (!this.Index) return null;
            for (var uuid in this.$.Index) {
                if (!options.conditions || this.matches(this.Index[uuid], options.conditions)) {
                    return this.$.Index[uuid];
                }
            }
            return null;
        } else if (mode == 'all') {
            var found = new STArray();
            if (!this.Index) return found; 
            for (var uuid in this.Index) {
                if (!options.conditions || this.matches(this.Index[uuid], options.conditions)) {
                    found.push(this.Index[uuid]);
                }
            }
            return found;
        } else if (STModel.Index[mode]) {
            return STModel.Index[mode];
        } else {
            ST.error('Model not found');
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
    
    $unserialize: function(data)
    {
        if (this._name == data['_model']) {
            var object = this.create();
            if (data['uuid']) object.set('uuid', data['uuid']);
            for (property in this.Properties) {
                if (data[property] !== undefined) {
                    object.set(property, data['property']);
                } else {
                    object.set(property, this.Properties[property]);
                }
            }
            return object;
        } else if (window[data['_model']]) {
            return window[data['_model']].unserialize(data);
        } else {
            return null;
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
        if (newUuid == this.uuid) return;
        
        delete STModel.Index[this.uuid];
        STModel.Index[newUuid] = this;
        
        if (this.$.Index) {
            delete this.$.Index[this.uuid];
        } else {
            this.$.Index = {};
        }
        this.$.Index[newUuid] = this;
        
        this.uuid = newUuid;
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
    
    serialize: function()
    {
        var o = {
            _model: this.$._name,
            uuid:   this.getUuid()
        };
        for (property in this.$.Properties) {
            var value = this.get(property);
            o[property] = value;
        }
        return o;
    },
    
end
:0});

STModel.$attribute = {_generator: function(f, member) {
    f.prototype['set' + ST.ucFirst(member)] = function(newValue) {
        var oldValue = this.attributes[member];
        this.attributes[member] = newValue;
        if (this._changed) this._changed(member, oldValue, newValue);
        return this;
    };
    f.prototype['get' + ST.ucFirst(member)] = function() {
        return this.attributes[member];
    };
}};

STModel.$one = function(assocModel) { return {_generator: function(f, member)
{
    STModel.$attribute._generator(f, member + 'Uuid');
    
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
        if (object && object.$._name != assocModel) {
            ST.error('Invalid object specified for association');
        }
        this.set(member + 'Uuid', object &&  object.uuid);
    };
}}};

STModel.$many = function(assocModel, foreign) { return {_generator: function(f, member)
{
    f.prototype['get' + ST.ucFirst(member)] = function() {
        if (!this[member]) {
            var conditions = {};
            conditions[foreign + 'Uuid'] = this.attributes.uuid;
            this[member] = STAssociation.create(window[assocModel], { conditions: conditions }); 
        }
        return this[member];
    };
}}};

STModel.$manyMany = function(assocModel) { return {_generator: function(f, member)
{
    
}}};