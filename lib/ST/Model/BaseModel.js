import * as $ from 'jquery'

import { makeClass } from '../../util/make-class'
import { BaseObject } from '../BaseObject'
import { Searchable } from './Searchable'
import { error } from '../../util/error'
import { Model } from '../Model'
import { Validates } from './Validates'
import { Callbacks } from './Callbacks'
import { Scope } from './Scope'
import { List } from '../List'
import { Index } from './Index'
import { ucFirst } from '../../util/uc-first'
import { singularize } from '../../util/singularize'

export const BaseModel = makeClass(BaseObject, (def) => {
  def.classMethod('fetch', function(uuid, callback) {
    const self = this;
  
    if (Model._byUuid[uuid]) {
      if (callback) { return callback(Model._byUuid[uuid]); }
    } else if (this.FETCH_URL) {
      return $.ajax({
        url:      this.FETCH_URL.replace('?', uuid),
        type:     'get',
        data:     this.FETCH_DATA || {},
        success(data) {
          const model = self.createWithData(data, {loaded: true});
          if (callback) { return callback(model); }
        }
      });
    } else {
      return error(`No find URL for model: ${this._name}`);
    }
  });

  def.classDelegate('where', 'scoped');
  def.classDelegate('order', 'scoped');
  def.classDelegate('each',  'scoped');
  def.classDelegate('first', 'scoped');
  def.classDelegate('count', 'scoped');
  
  def.include(Validates);
  def.include(Callbacks);
  def.callback('create');
  def.callback('destroy');
  
  def.classMethod('scoped', function() {
    return Scope.createWithModel(this);
  });

  def.classMethod('find', uuid => Model._byUuid[uuid]);
  
  def.classMethod('load', function(data) {
    const self = this;
    if (data instanceof Array) {
      return Array.from(data).map((row) =>
        this.load(row));
    } else {
      if (!data || !data.uuid) { return; }
      if (Model._byUuid[data.uuid]) { return; }
      return this.createWithData(data);
    }
  });
  
  def.classMethod('master', function() {
    return this._master || (this._master = List.create());
  });
  
  def.classMethod('index', function(attribute) {
    if (!this._indexes) { this._indexes = {}; }
    return this._indexes[attribute] || (this._indexes[attribute] = Index.createWithModelAttribute(this, attribute));
  });

  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.initWithData({}, options);
    return this;
  });

  // Initializes a new model, and loads the supplied attribute data, if any
  def.initializer('withData', function(data, options) {
    if (options == null) { options = {}; }
    const self = this;
    
    if (!options.loaded) { this.callBefore('create'); }
    
    BaseObject.prototype.init.call(this);
    
    this.uuid(data.uuid || Model._generateUUID());
    this._creating = true;
    this._attributes = {};
    for (var attribute in this._class._attributes) {
      const details = this._class._attributes[attribute];
      if (this._class._attributes.hasOwnProperty(attribute)) {
        if (data[attribute] != null) {
          this[attribute](data[attribute]);
        } else if (!details.virtual) {
          this[attribute](details.default);
        }
      }
    }
    
    // Add class to indexes
    if (this._class._indexes) {
      for (attribute in this._class._attributes) {
        if (this._class._attributes.hasOwnProperty(attribute)) {
          var index;
          if (index = this._class._indexes[attribute]) {
            index.add(this._attributes[attribute], this); 
          }
        }
      }
    }
  
    if (this._class._manyBinds) {
      for (let binding of Array.from(this._class._manyBinds)) {
        this.get(binding.assoc).bind(binding.from, self, binding.to);
      }
    }
    
    if (!options.loaded && !this._class.ReadOnly) {
      Model.recordChange('create', this._uuid, this._class._name, this.data());
    }
    
    this._creating = false;
    this._class.master().add(this);
    
    if (!options.loaded) { return this.callAfter('create'); }
  });

  // Creates a new object from model data. If the data includes a 
  // property, as with data genereated by #objectify, the specified model
  // will be used instead of the model createWithData was called on.
  def.classMethod('createWithData', function(data, options) {
    // If data is being sent to the wrong model, transfer to correct model
    if (options == null) { options = {}; }
    if (data.model && (data.model !== this._name)) {
      let modelClass;
      if ((modelClass = this._namespace.class(data.model))) {
        return modelClass.createWithData(data, options);
      } else {
        return null;
      }
    // If object with uuid already exists, return existing object
    } else if (data.uuid && Model._byUuid[data.uuid]) {
      return Model._byUuid[data.uuid];
    // Otherwise, create a new object
    } else {
      const object = new (this);
      object.initWithData(data, options);
      return object;
    }
  });

  def.property('uuid');

  def.method('setUuid', function(newUuid) {
    if (!this._uuid) {
      newUuid = String(newUuid);
      
      // Insert object in global index
      Model._byUuid[newUuid] = this;
  
      // Insert object in model-specific index
      if (!this._class._byUuid) { this._class._byUuid = {}; }
      this._class._byUuid[newUuid] = this;
  
      return this._uuid = newUuid;
    }
  });

  def.method('matches', function(conditions) {
    if (this._attributes) {
      for (let condition of Array.from(conditions)) {
        if (!condition.test(this)) { return false; }
      }
      return true;
    } else {
      return false;
    }
  });

  def.method('_changed', function(member, oldValue, newValue) {
    this.super(member, oldValue, newValue);
    this._class.trigger('itemChanged', this);
    
    if (this._attributes[member] !== undefined) {
      if (!this._creating && (String(oldValue) !== String(newValue)) && !this._class.ReadOnly) {
        const data = {};
        data[member] = newValue;
        return Model.recordChange('update', this._uuid, this._class._name, data);
      }
    }
  });
  
  def.method('writeAttribute', function(name, rawValue) {
    const oldValue = this._attributes[name];
  
    // Convert new value to correct type
    const details = this._class._attributes[name];
    const newValue = this._class.convertValueToType(rawValue, details.type);

    // Set new value
    this._attributes[name] = newValue;

    if (this._creating) {
      if (this._class._searchProperties && (this._class._searchProperties.indexOf(name) >= 0)) { return this.indexForKeyword(newValue); }
    } else {
      // Update index
      if (this._class._indexes) {
        let index;
        if (index = this._class._indexes[name]) {
          index.remove(oldValue, this);
          index.add(newValue, this);
        }
      }

      // Trigger changed event
      if (this._changed) { this._changed(name, oldValue, newValue); }
      return this.trigger('changed', name, oldValue, newValue);
    }
  });
  
  // Returns saveable object containing model data.
  def.method('data', function() {
    const output = {};
    for (let attribute in this._attributes) {
      if (this._attributes.hasOwnProperty(attribute)) {
        let value = this._attributes[attribute];
        if (value instanceof Date) { value = String(value); }
        output[attribute] = value;
      }
    }
    return output;
  });

  // Saves model data and saved status in Storage for persistance.
  def.method('persist', function() {
    if (Model._storage) {
      return Model._storage.set(this.uuid(), JSON.stringify(this.data()));
    }
  });
  
  // Removes all local data for model.
  def.method('forget', function(destroy) {  
    if (destroy == null) { destroy = false; }
    if (destroy) { this.callBefore('destroy'); }
  
    // Record destruction in change list, if destroy is true
    if (destroy && !this._class.ReadOnly) {
      Model.recordChange('destroy', this._uuid, this._class._name);
    }
    
    // Unbind any loose bindings
    if (this._boundTo) {
      for (let binding of Array.from(this._boundTo)) {
        binding.source.unbindOne(binding.trigger, this);
      }
    }
    
    // Propagate to dependent associated objects
    if (this._class._dependent) {
      for (let dependent of Array.from(this._class._dependent)) {
        this[dependent]().forgetAll(destroy);
      }
    }

    // Remove from global index
    delete Model._byUuid[this._uuid];
  
    // Remove from model index
    delete this._class._byUuid[this._uuid];
  
    // Remove from attribute indexes
    if (this._class._indexes) {
      for (let attribute in this._class._indexes) {
        const index = this._class._indexes[attribute];
        if (index.remove) { index.remove(this._attributes[attribute], this); }
      }
    }
  
    // Remove from persistant storage
    if (Model._storage) { Model._storage.remove(this._uuid); }
  
    this._class.master().remove(this);
    
    if (destroy) { this._destroyed = true; }
    
    if (destroy) { return this.callAfter('destroy'); }
  });
  
  // Marks model as destroyed, destroy to be propagated to server when 
  // possible.
  def.method('destroy', function() {
    return this.forget(true);
  });

  this.classMethod('convertValueToType', function(value, type) {
    if (value === null) {
      return null;
    } else {
      switch (type) {
        case 'string':
          return String(value);
        case 'real':
          return Number(value);
        case 'integer':
          return Math.round(Number(value));
        case 'bool':
          return !!value;
        case 'datetime':
          const date = new Date(value);
          if (isNaN(date.getTime())) { return null; } else { return date; }
        default:
          return value;
      }
    }
  });
  
  def.classMethod('attribute', function(name, type, options) {
    const ucName = ucFirst(name);
  
    if (!this._attributes) { this._attributes = {}; }
    this._attributes[name] = {
      type,
      virtual:  false,
      default:  null,
      null:     true
    };
    for (let option in options) {
      const value = options[option];
        this._attributes[name][option] = value;
    }
    
    this.method(`set${ucName}`, function(rawValue) {
      return this.writeAttribute(name, rawValue);
    });
  
    this.method(`get${ucName}`, function() { return this._attributes[name]; });
  
    this.accessor(name);
    return this.matchers(name);
  });
  
  // Create convenience attribute method for each data type
  for (let type of ['string', 'integer', 'real', 'bool', 'datetime', 'enum']) {
    def.classMethod(type, (type =>
      function(name, options) {
        return this.attribute(name, type, options);
      }
    )(type)
    );
  }
  
  def.classMethod('virtual', function(name, type, defaultValue) {
    this.accessor(name);
    if (!this._attributes) { this._attributes = {}; }
    this._attributes[name] = {
      default:  defaultValue,
      type,
      virtual:  true
    };
    return this.matchers(name);
  });
  
  def.classMethod('matchers', function(name) {
    const _not = function() {
      const oldTest = this.test;
      return {
        attribute: this.attribute,
        test(item) { return !oldTest(item); }
      };
    };
  
    return this[name] = {
      null() {
        return {
          attribute:  name,
          test(item) { return item[name]() === null; },
          not:        _not
        };
      },
      equals(value) {
        value = String(value);
        return {
          type:       'equals',
          attribute:  name,
          value,
          test(item) { return String(item[name]()) === value; },
          not:        _not
        };
      },
      equalsci(value) {
        value = String(value).toLowerCase();
        return {
          attribute:  name,
          value,
          test(item) { return String(item[name]()).toLowerCase() === value; },
          not:        _not
        };
      },
      lessThan(value) {
        value = Number(value);
        return {
          attribute:  name,
          value,
          test(item) { return Number(item[name]()) < value; },
          not:        _not
        };
      },
      lessThanOrEquals(value) {
        value = Number(value);
        return {
          attribute:  name,
          value,
          test(item) { return Number(item[name]()) <= value; },
          not:        _not
        };
      },
      greaterThan(value) {
        value = Number(value);
        return {
          attribute:  name,
          value,
          test(item) { return Number(item[name]()) > value; },
          not:        _not
        };
      },
      greaterThanOrEquals(value) {
        value = Number(value);
        return {
          attribute:  name,
          value,
          test(item) { return Number(item[name]()) >= value; },
          not:        _not
        };
      },
      tests(callback) {
        return {
          attribute:  name,
          test:       callback,
          not:        _not
        };
      }
    };
  });

  def.classMethod('belongsTo', function(name, options) {
    if (options == null) { options = {}; }
    this.string(`${name}Uuid`, {null: options.null});
  
    const ucName = ucFirst(name);
    if (!options.model) { options.model = ucName; }
  
    this.method(`get${ucName}`, function() {
      const uuid = this[`${name}Uuid`]();
      return Model._byUuid[uuid] || null;
    });
  
    this.method(`set${ucName}`, function(value) {
      if (value && (value._class._name !== options.model)) { error('Invalid object specified for association'); }
      return this[`${name}Uuid`](value && value.uuid());
    });
  
    this.virtual(name, 'belongsTo', null);
    
    for (let option in options) {
      if (options.hasOwnProperty(option)) {
        this._attributes[name][option] = options[option];
      }
    }
    
    const matchers = this[`${name}Uuid`];
    this[name] = {
      is(value) {
        return matchers.equals(value && String(value.uuid()));
      }
    };

    if (options.bind) {
      const setUuidName = `set${ucName}Uuid`;
      const oldSet = this.prototype[setUuidName];
      return this.method(setUuidName, function(newValue) {
        const oldValue = this._attributes[name];
        if (oldValue !== newValue) {
          let key;
          if (oldValue && oldValue.unbind) {
            for (key in options.bind) {
              oldValue.unbind(key, this);
            }
          }
          oldSet.call(this, newValue);
          if (newValue && newValue.bind) {
            return (() => {
              const result = [];
              for (key in options.bind) {
                result.push(oldValue.bind(key, this, options.bind[key]));
              }
              return result;
            })();
          }
        }
    });
    }
  });

  def.classMethod('hasMany', function(name, options) {
    if (options == null) { options = {}; }
    const foreign = options.foreign || this._name.toLowerCase();
    const modelName = options.model || ucFirst(singularize(name));
  
    // One-to-many assocation through a Model and foreign key
    this.method(name, function() {
      if (!this[`_${name}`]) {
        const model = this._class._namespace.class(modelName);
        const scope = (this[`_${name}`] = model.where(model[`${foreign}Uuid`].equals(this.uuid())));
        scope.addBindings();
      }
      return this[`_${name}`];
  });
  
    if (options.bind) {
      for (let key in options.bind) {
        if (!this._manyBinds) { this._manyBinds = []; }
        this._manyBinds.push({
          assoc:  name,
          from:   key,
          to:     options.bind[key]
        });
      }
    }
    
    if (options.dependent) {
      if (!this._dependent) { this._dependent = []; }
      return this._dependent.push(name);
    }
  });
  
  def.classMethod('labelForAttribute', attribute => ucFirst(attribute.replace(/([A-Z])/g, " $1").replace(/\sUuid$/, '')));

  def.include(Searchable);
});
