STObject.subClass('STModel', {
    Index: {},
    NotFound: {},
    GenerateUUID: Math.uuid || (function() { return null; }),
    Storage: null,
    
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
            if (conditions[key] instanceof Function) {
                if (!conditions[key](object.attributes[key])) return false;
            } else {
                if (object.attributes[key] != conditions[key]) return false;
            }
        }
        return true;
    },
    
    $find: function(mode, options)
    {
        if (!options) options = {};
        
        if (mode == 'first') {
            if (!this.Index) return null;
            for (var uuid in this.Index) {
                if (
                    !this.Index[uuid].destroyed &&
                    (
                        !options.conditions ||
                        this.matches(this.Index[uuid], options.conditions)
                    )
                ) {
                    return this.Index[uuid];
                }
            }
            return null;
        } else if (mode == 'all') {
            var found = new STArray();
            if (!this.Index) return found; 
            for (var uuid in this.Index) {
                if (
                    !this.Index[uuid].destroyed &&
                    (
                        !options.conditions ||
                        this.matches(this.Index[uuid], options.conditions)
                    )
                ) {
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
    
    $first: function(options)
    {
        return this.find('first', options);
    },
    
    $all: function(options)
    {
        return this.find('all', options)
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
    
    $buildIndex: function(attribute)
    {
        var indexName = 'Index' + ST.ucFirst(attribute);
        if (this[indexName]) return;
        
        var index = {};
        for(var uuid in this.Index) {
            var object = this.Index[uuid]
            var value = object.attributes[attribute];
            if (!index[value]) index[value] = STList.create();
            index[value].add(object);
        }
        this[indexName] = index;
    },
    
    $getValueIndex: function(attribute, value)
    {
        var indexName = 'Index' + ST.ucFirst(attribute);
        if (!this[indexName]) this.buildIndex(attribute);
        
        var index = this[indexName];
        if (!index[value]) index[value] = STList.create();
        return index[value];
    },
    
    $getUpdatedModelData: function()
    {
        var data = {
            created: [],
            updated: [],
            deleted: []
        };
        for (var uuid in this.Index) {
            var model = this.Index[uuid];
            if (model.created && model.approved) {
                data.created.push({
                    '_model':   model.$._name,
                    uuid:       model.getUuid()
                });
                data.updated.push(model.objectify());
            } else if (model.updated && model.approved) {
                data.updated.push(model.objectify());
            } else if (model.deleted) {
                data.deleted.push({
                    '_model':   model.$._name,
                    uuid:       model.getUuid()
                });
            }
        }
        return data;
    },
    
    $saveToServer: function(url, async)
    {
        var updatedData = this.getUpdatedModelData();
        
        if (updatedData.created.length == 0 &&
            updatedData.updated.length == 0 &&
            updatedData.deleted.length == 0)
            return null;
        
        return $.ajax({
            url:    url,
            type:   'post',
            async:  async === undefined ? true : async,
            data:   {data: JSON.stringify(updatedData)},
            success: function(data) {
                (new STArray('created', 'updated', 'deleted')).each(function(type) {
                    if (data[type] && data[type] instanceof Array) STArray.prototype.each.call(data[type], function(uuid) {
                       var object = STModel.find(uuid);
                       if (object) object.set(type, false);
                    });
                });
            }
        });
    },
    
    init: function()
    {
        return this.initWithData({});
    },
    
    /**
     * Initializes a new model, and loads the supplied attribute data, if 
     * any.
     */
    initWithData: function(data)
    {
        var self = this;
        
        STObject.prototype.init.call(this);
        this.approved = true;
        this.created = !data['uuid'];
        this.deleted = false;
        this.setUuid(data['uuid'] || STModel.GenerateUUID());
        this.attributes = {};
        for (var attribute in this.$.Attributes) {
            if (data[attribute] !== undefined) {
                this.set(attribute, data[attribute]);
            } else {
                var defaultValue = this.$.Attributes[attribute]
                if (typeof defaultValue == 'function') {
                    this.set(attribute, new defaultValue());
                } else {
                    this.set(attribute, defaultValue);
                }
            }
        }
        if (this.$.ManyMany) this.$.ManyMany.each(function(key) {
            var fullKey = key + 'Uuids';
            self.attributes[fullKey] = new STArray();
            if (data[fullKey]) {
                self.attributes[fullKey].append(data[fullKey]);
            }
        });
        if (this.$.ManyBinds) {
            this.$.ManyBinds.each(function(binding) {
                self.get(binding.assoc).bind(binding.from, self, binding.to);
            });
        }
        this.updated = false;
        this.setUuid = null;
        this.persist();
    },
    
    /**
     * Creates a new object from model data. If the data includes a _model
     * property, as with data genereated by #objectify, the specified model
     * will be used instead of the model createWithData was called on.
     */
    $createWithData: function(data)
    {
        //If data is being sent to the wrong model, transfer to correct model
        if (data._model && data._model != this._name) {
            if (window[data._model]) {
                return window[data._model].createWithData(data);
            } else {
                return null;
            }
        //If object with uuid already exists, update object and return it
        } else if (data.uuid && STModel.Index[data.uuid]) {
            var object = STModel.Index[data.uuid];
            for (var attribute in object.attributes) {
                if (data[attribute] !== undefined) {
                    object.set(attribute, data[attribute]);
                }
            }
            return object;
        //Otherwise, create a new object
        } else {
            return (new this).initWithData(data);
        }
    },
    
    uuid:       ST.$property,
    
    /** 
     * These properties specify what changes have been made locally and need
     * to be synchronized to the server.
     *
     * Newly created objects will only be saved if they are marked as
     * approved.
     */
    created:    ST.$property,   
    updated:    ST.$property,
    deleted:    ST.$property,
    approved:   ST.$property,
    
    /**
     * Makes a new uuid for object.
     */
    resetId: function()
    {
        this.id = null;
        this.uuid = STModel.GenerateUUID();
    },
    
    setUuid: function(newUuid)
    {
        if (newUuid == this.uuid) return;
        
        //Insert object in global index
        delete STModel.Index[this.uuid];
        STModel.Index[newUuid] = this;
        
        //Insert object in model-specific index
        if (!this.$.Index) this.$.Index = {};
        var index = this.$.Index;
        if (index[this.uuid]) delete index[this.uuid];
        index[newUuid] = this;
        
        this.uuid = newUuid;
    },
    
    markChanged: function()
    {
        this.changed = true;
    },
    
    _changed: function(member, oldValue, newValue)
    {
        // console.log(this + '.' + member + ' changed from "' + oldValue + '" to ""' + newValue + '""');
        this._super(member, oldValue, newValue);
        this.markChanged();
    },
    
    /**
     * Returns saveable object containing model data.
     */
    objectify: function()
    {
        var o = {
            _model: this.$._name,
            uuid:   this.getUuid()
        };
        for (var attribute in this.attributes) {
            var value = this.attributes[attribute];
            if (value instanceof Date) {
                value = String(value);
            }
            o[attribute] = value;
        }
        return o;
    },
    
    /**
     * Saves model data and saved status in Storage for persistance.
     */
    persist: function()
    {
        if (!STModel.Storage) return;
        var o = this.objectify();
        o._created = this.created;
        o._updated = this.updated;
        o._deleted = this.deleted;
        o._approved = this.approved;
        STModel.Storage.set(this.uuid, o);
    },
    
    release:    function() {},
    retain:     function() {},
    
    /**
     * Removes model from all indexes.
     */
    deindex: function()
    {
        for (var attribute in this.attributes) {
            var indexName = 'Index' + ST.ucFirst(attribute);
            var value = this.attributes[attribute];
            if (this.$[indexName]) {
                var index = this.$[indexName];
                if (index[value]) index[value].remove(this);
            }
        }
    },
    
    /**
     * Marks model as destroyed, destroy to be propagated to server when 
     * possible.
     */
    destroy: function()
    {
        this.deleted = this.destroyed = true;
        this.deindex();
        this.updated = this.created = false;
        this.persist();
    },
    
    /**
     * Removes all local data for model.
     */
    forget: function()
    {
        this.deindex();
        delete STModel.Index[this.uuid];
        if (STModel.Storage) STModel.Storage.remove(this.uuid);
        STObject.prototype.destroy.apply(this);
    },
end
:0});

STModel.$attribute = function(defaultValue) {
    return {_generator: function(f, member) {
        var ucMember = ST.ucFirst(member);
        
        if (!f.Attributes) f.Attributes = {};
        f.Attributes[member] = defaultValue;
        
        f.prototype['set' + ucMember] = function(newValue) {
            var oldValue = this.attributes[member];
        
            //Set new value
            this.attributes[member] = newValue;
        
            //Update index
            if (this.$['Index' + ucMember]) {
                var index = this.$['Index' + ucMember];
                if (index[oldValue]) {
                    index[oldValue].remove(this);
                }
                if (!index[newValue]) {
                    index[newValue] = STList.create();
                }
                index[newValue].add(this);
            }
        
            //Trigger changed event
            if (this._changed) this._changed(member, oldValue, newValue);
            this.trigger('changed', member, oldValue, newValue);
            
            this.setUpdated(true);
            this.persist();
        
            return this;
        };
        f.prototype['get' + ucMember] = function() {
            return this.attributes[member];
        };
    }};
};
STModel.$attribute._generator = STModel.$attribute(null)._generator;

STModel.$one = function(assocModel) { return {_generator: function(f, member, options)
{
    if (!options) options = {};
    
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
        this.set(member + 'Uuid', object && object.uuid);
        
        return this;
    };
    
    if (options.bind) {
        var oldSet = f.prototype['set' + ucMember + 'Uuid'];
        f.prototype['set' + ucMember + 'Uuid'] = function(newValue) {
            var oldValue = this.attributes[member];
            if (oldValue == newValue) return;
            if (oldValue.unbind) {
                for (key in options.bind) {
                    oldValue.unbind(key, this);
                }
            }
            oldSet.call(this, newValue);
            if (newValue.bind) {
                for (key in options.bind) {
                    oldValue.bind(key, this, options.bind[key])
                }
            }
        };
    }
}}};

STModel.$many = function(assocModel, foreign, options) { return {_generator: function(f, member)
{
    f.prototype['get' + ST.ucFirst(member)] = function() {
        if (!this[member]) {
            var conditions = {};
            conditions[foreign + 'Uuid'] = this.uuid;
            this[member] = STAssociation.create(window[assocModel], { conditions: conditions }); 
        }
        return this[member];
    };
    if (options && options.bind) {
        for (var key in options.bind) {
            if (!f.ManyBinds) f.ManyBinds = new STArray();
            f.ManyBinds.push({
                assoc:  member,
                from:   key,
                to:     options.bind[key]
            });
        }
    }
}}};

STModel.$manyMany = function(assocModel) { return {_generator: function(f, member)
{
    if (!f.ManyMany) f.ManyMany = new STArray();
    f.ManyMany.push(member);
    f.prototype['get' + ST.ucFirst(member)] = function() {
        if (!this[member]) {
            this[member] = STManyAssociation.create(this, member);
        }
        return this[member];
    };
}}};

STModel.setStorage = function(storage)
{
    if (storage) storage.retain();
    if (STModel.Storage) STModel.Storage.release();
    STModel.Storage = storage;
    
    if (!storage) return;
    
    //Save any existing models to new storage
    for (var i in STModel.Index) {
        STModel.Index[i].persist();
    }
    
    //Load any unloaded saved models from storage
    storage.each(function(key, value) {
        if (value && value._model && window[value._model] && !STModel.Index[key]) {
            var model = STModel.createWithData(value);
            if (value._created !== undefined) model.created = value._created;
            if (value._updated !== undefined) model.updated = value._updated;
            if (value._deleted !== undefined) model.deleted = value._deleted;
            if (value._approved !== undefined) model.approved = value._approved;
        }
    });
};