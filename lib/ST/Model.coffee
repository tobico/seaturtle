ST.class 'Model', ->
  @include 'Enumerable'
  
  @Index        = {}
  @NotFound     = {}
  @GenerateUUID = Math.uuid || (-> null)
  @Storage      = null
  @Debug        = false
  
  @classMethod 'fetch', (uuid, callback) ->
    var self = this;
            
    if (STModel.Index[uuid]) {
        callback(STModel.Index[uuid])
    } else if (this.FindUrl) {
        $.ajax({
            url:    this.FindUrl.replace('?', uuid),
            type:   'get',
            data:   this.FindData || {},
            success: function(data) {
                var model = STModel.createWithData(data);
                callback(model);
            }
        });
    } else {
        ST.error('No find URL for model: ' + self._name);
    }
  
  @classMethod 'find', (mode, options) ->
    var self = this;
    if (!options) options = {};
    
    if (mode == 'first' || mode == 'all') {
        if (STModel.Debug) {
            console.log('Finding ' + mode + ' in ' + this._name + ', with options:' + JSON.stringify(options));
        }

        var found = new STArray();
        if (!this.Index) return (mode == 'first') ? null : found;
        
        var index = false;
        var nonIndexConditions = 0;
        for (var key in options.conditions) {
            var indexName = 'Index' + ST.ucFirst(key);
            if (!index && this[indexName]) {
                var value = options.conditions[key];
                if (this[indexName][value]) {
                    index = this[indexName][value].array;
                } else {
                    if (STModel.Debug) console.log('Found empty index for condition: ' + key + '=' + value);
                    if (mode == 'first') return null;
                    else return new STArray();
                }
            } else {
                nonIndexConditions++;
            }
        }
        
        if (index) {
            if (nonIndexConditions == 0) {
                if (STModel.Debug) console.log('Indexed result - ' + index.length);
                if (mode == 'first') return index.length ? index[0] : null;
                return index;
            } else {
                if (STModel.Debug) {
                    console.log('Partially-Indexed result');
                    console.log(options.conditions);
                }
                var filter = function(o) {
                    return o.matches(options.conditions);
                };
                if (mode == 'first') return index.find(filter);
                else return index.collect(filter);
            }
        } else {            
            if (STModel.Debug) console.log('Unindexed result');
            for (var uuid in this.Index) {
                if (
                    !this.Index[uuid].destroyed &&
                    (
                        !options.conditions ||
                        this.Index[uuid].matches(options.conditions)
                    )
                ) {
                    if (mode == 'first') return this.Index[uuid];
                    else found.push(this.Index[uuid]);
                }
            }
            if (mode == 'first') return null;
            else return found;
        }
    } else if (mode == 'by' || mode == 'all_by') {
        var conditions = {};
        conditions[arguments[1]] = arguments[2];
        return this.find(
            mode == 'by' ? 'first' : 'all',
            {conditions: conditions}
        );
    } else if (STModel.Index[mode]) {
        return STModel.Index[mode];
    } else {
        ST.error('Model not found');
    }
  
  @classMethod 'load', (data) ->
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
  
  @classMethod 'buildIndex', (attribute) ->
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
  
  @classMethod 'getValueIndex', (attribute, value) ->
    var indexName = 'Index' + ST.ucFirst(attribute);
    if (!this[indexName]) this.buildIndex(attribute);
    
    var index = this[indexName];
    if (!index[value]) index[value] = STList.create();
    return index[value];
  
  @classMethod 'getUpdatedModelData', ->
    var data = {
        created: [],
        updated: [],
        deleted: []
    };
    for (var uuid in this.Index) {
        var model = this.Index[uuid];
        if (model.$.ReadOnly) continue;
        if (model.created && model.approved) {
            data.created.push(model.objectify());
        } else if (model.updated && model.approved) {
            data.updated.push(model.objectify());
        } else if (model.deleted) {
            data.deleted.push({
                '_model':   model.$._name,
                uuid:       model.getUuid()
            });
        }
    }
    data.created.sort(ST.makeSortFn('uuid'));
    return data;
  
  @classMethid 'saveToServer', (url, async, extraData) ->
    if (STModel.Saving) return;
    
    var updatedData = this.getUpdatedModelData();
    
    if (updatedData.created.length == 0 &&
        updatedData.updated.length == 0 &&
        updatedData.deleted.length == 0)
        return null;
    
    STModel.Saving = true;
    
    var data = {data: JSON.stringify(updatedData)};
    if (extraData) $.extend(data, extraData);
    
    if (STModel.SaveStarted) STModel.SaveStarted();
    
    return $.ajax({
        url:    url,
        type:   'post',
        async:  async === undefined ? true : async,
        data:   data,
        success: function(data) {
            if (STModel.SaveFinished) STModel.SaveFinished();
            
            if (data.status && data.status == 'Access Denied') {
                if (STModel.AccessDeniedHandler) {
                    STModel.AccessDeniedHandler();
                }
            }
            
            (new STArray('created', 'updated', 'deleted')).each(function(type) {
                if (data[type] && data[type] instanceof Array) STArray.prototype.each.call(data[type], function(uuid) {
                   var object = STModel.find(uuid);
                   if (object) object.set(type, false).persist();
                });
            });
        },
        complete: function() {
            STModel.Saving = false;
        }
    });
  
  @constructor (options) ->
    @initWithData {}, options
  
  # Initializes a new model, and loads the supplied attribute data, if any
  @constructor 'withData', (data, options) ->
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
    this.persists = !(options && options.temporary);
    this.persist();
  
  # Creates a new object from model data. If the data includes a _model
  # property, as with data genereated by #objectify, the specified model
  # will be used instead of the model createWithData was called on.
  @classMethod 'createWithData', (data, options) ->
    # If data is being sent to the wrong model, transfer to correct model
    if (data._model && data._model != this._name) {
        if (window[data._model]) {
            return window[data._model].createWithData(data, options);
        } else {
            return null;
        }
    # If object with uuid already exists, update object and return it
    } else if (data.uuid && STModel.Index[data.uuid]) {
        var object = STModel.Index[data.uuid];
        if (!(options && options.temporary)) object.persists = true;
        for (var attribute in object.attributes) {
            if (data[attribute] !== undefined) {
                object.set(attribute, data[attribute]);
            }
        }
        return object;
    # Otherwise, create a new object
    } else {
        return (new this).initWithData(data, options);
    }
  
  @property 'uuid'
  
  # These properties specify what changes have been made locally and need
  # to be synchronized to the server.
  #
  # Newly created objects will only be saved if they are marked as
  # approved.
  @property 'created'
  @property 'updated'
  @property 'deleted'
  @property 'approved'
  
  # Makes a new uuid for object.
  @method 'resetId', ->
    this.id = null;
    this.uuid = STModel.GenerateUUID();
  
  @method 'setUuid', (newUuid) ->
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
  
  @method 'matches', (conditions) ->
    if (!this.attributes) return false;
    for (var key in conditions) {
        if (conditions[key] instanceof Function) {
            if (!conditions[key](this.attributes[key])) return false;
        } else {
            if (this.attributes[key] != conditions[key]) return false;
        }
    }
    return true;

  # Returns (and creates if needed) a STList to contain objects from
  # a corresponsing one-to-many relationship using a plain array of UUIDs.
  # 
  # When list is created, triggers are bounds so that items added or
  # removed from the list are reflected in the UUIDs array.
  @method 'getManyList', (member) ->
    # Create list if it doesn't already exist
    if (!this[member]) {        
        var s = ST.singularize(member);
    
        # Create a new list, with bindings for itemAdded and itemRemoved
        this[member] = STList.create()
            .bind('itemAdded', this, s + 'Added')
            .bind('itemRemoved', this, s + 'Removed');
    
        # Create new method to update UUIDs on added events
        this[s + 'Added'] = function(list, item) {
            this[s + 'Uuids'].push(item);
            this.setUpdated(true).persist();
        };
    
        # Create new method to update UUIDs on removed events
        this[s + 'Removed'] = function(list, item) {
            STArray.prototype.remove.call(this[s + 'Uuids'], item);
            this.setUpdated(true).persist();
        }
        
        this[member].find = function(mode, options) {
            if (mode == 'first' || mode == 'all') {
                var all = mode == 'all';
                if (options && options.conditions) {
                    var filter = function(o) {
                        return o.matches(options.conditions);
                    };
                    if (all) return this.array.collect(filter);
                    else return this.array.find(filter);
                } else {
                    return all ? this : this.objectAtIndex(0);
                }
            } else if (mode == 'by' || mode == 'all_by') {
                var conditions = {};
                conditions[arguments[1]] = arguments[2];
                return this.find(
                    mode == 'by' ? 'first' : 'all',
                    {conditions: conditions}
                );
            } else {
                return this.array.find.apply(this.array, arguments);
            }
        };
        
        this[member + 'NeedsRebuild'] = true;
    }
    
    # Rebuild items in list if marked for rebuild
    if (this[member + 'NeedsRebuild']) {
        var uuids = this.attributes[ST.singularize(member) + 'Uuids'];
        var list = this[member];
        
        # Rebuild by accessing array directly, so that we don't fire off
        # our own triggers
        list.array.empty();
        STArray.prototype.each.call(uuids, function(uuid) {
            var object = STModel.Index[uuid];
            if (object) list.array.push(object);
        });            
        
        this[member + 'NeedsRebuild'] = false;
    }
    
    return this[member];
  
  @method 'markChanged', ->
    @changed = true
  
  @method '_changed', (member, oldValue, newValue) ->
    @_super member, oldValue, newValue
    @markChanged()
  
  # Returns saveable object containing model data.
  @method 'objectify', ->
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
  
  # Saves model data and saved status in Storage for persistance.
  @method 'persist', ->
    if (!STModel.Storage || !this.persists) return;
    var o = this.objectify();
    o._created = this.created;
    o._updated = this.updated;
    o._deleted = this.deleted;
    o._approved = this.approved;
    STModel.Storage.set(this.uuid, o);
  
  # Removes model from all indexes.
  @method 'deindex', ->
    for (var attribute in this.attributes) {
        var indexName = 'Index' + ST.ucFirst(attribute);
        var value = this.attributes[attribute];
        if (this.$[indexName]) {
            var index = this.$[indexName];
            if (index[value]) index[value].remove(this);
        }
    }
  
  # Marks model as destroyed, destroy to be propagated to server when 
  # possible.
  @method 'destroy', ->
    @deleted = @destroyed = true
    @deindex()
    @updated = @created = fals;
    @persist()
  
  # Removes all local data for model.
  @method 'forget', ->
    this.deindex();
    delete STModel.Index[this.uuid];
    if (STModel.Storage) STModel.Storage.remove(this.uuid);
    STObject.prototype.destroy.apply(this);

  @classMethod 'attribute', (name, defaultValue) ->
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
  
  @classMethod 'belongsTo', (name, assocModel) ->
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

  @classMethod 'hasMany', (name, assocModel, foreign=null, options={}) ->
    if foreign
      # One-to-many assocation through a Model and foreign key
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
    else    
      # One-to-many association using a Uuids attribute
      var attr = ST.singularize(member) + 'Uuids';
      var ucAttr = ST.ucFirst(attr);
  
      if (!f.Attributes) f.Attributes = {};
      f.Attributes[attr] = Array;
  
      #setCustomerUuids
      f.prototype['set' + ucAttr] = function(newValue) {
          this.attributes[attr] = newValue;
          this[member + 'NeedsRebuild'] = true;
          this.setUpdated(true).persist();
          return this;
      };
  
      #getCustomerUuids
      f.prototype['get' + ucAttr] = function() {
          return this.attributes[attr];
      };
  
      var ucMember = ST.ucFirst(member);
      var ucsMember = ST.ucFirst(ST.singularize(member));
  
      #getCustomers
      f.prototype['get' + ucMember] = function()
      {
          return this.getManyList(member);
      };
  
      #addCustomer
      f.prototype['add' + ucsMember] = function(record)
      {
          this.getManyList(member).add(record);
          return this;
      };
      
  @classMethod 'hasAndBelongsToMany', (name, assocModel) ->
    if (!f.ManyMany) f.ManyMany = new STArray();
    f.ManyMany.push(member);
    f.prototype['get' + ST.ucFirst(member)] = function() {
        if (!this[member]) {
            this[member] = STManyAssociation.create(this, member);
        }
        return this[member];
    };
    
  @setStorage = (storage) ->
    if (storage) storage.retain();
    if (STModel.Storage) STModel.Storage.release();
    STModel.Storage = storage;
  
    if (!storage) return;
  
    # Save any existing models to new storage
    for (var i in STModel.Index) {
        STModel.Index[i].persist();
    }
  
    # Load any unloaded saved models from storage
    storage.each(function(key, value) {
        if (value && value._model && window[value._model] && !STModel.Index[key]) {
            var model = STModel.createWithData(value);
            if (value._created !== undefined) model.created = value._created;
            if (value._updated !== undefined) model.updated = value._updated;
            if (value._deleted !== undefined) model.deleted = value._deleted;
            if (value._approved !== undefined) model.approved = value._approved;
        }
    });