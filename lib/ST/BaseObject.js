import { makeClass } from '../util/make-class'
import { ucFirst } from '../util/uc-first'
import { Command } from '../util/command'
import { error } from '../util/error'

const _logging = false

export const BaseObject = makeClass(null, (def) => {
  // Don't include BaseObject methods when profiling
  def._unlogged = true;
  
  // Used to override an existing method of an STObject. Allows the overriding
  // method to call the overridden method using `@super()`, no matter how
  // many methods are chained together.
  def.OverrideMethod = (oldMethod, newMethod) =>
    function() {
      const oldSuper = this.super || null;
      this.super = oldMethod;
      const result = newMethod.apply(this, arguments);
      this.super = oldSuper;
      return result;
    }
  ;
  
  def.MethodToString = function() { return this.displayName; };
  
  // Override or assign class method
  def.classMethod = function(name, fn) {
    if (this[name]) {
      return this[name] = BaseObject.OverrideMethod(this[name], fn);
    } else {
      this[name] = fn;
      return this._classMethods.push(name);
    }
  };
  def._classMethods.push('classMethod');
  
  // Override or assign instance method
  def.classMethod('method', function(name, fn) {
    if (fn != null) {
      if (this._superclass && this._superclass.prototype[name]) {
        this.prototype[name] = BaseObject.OverrideMethod(this._superclass.prototype[name], fn);
      } else if (_logging && !this._unlogged) {
        this.prototype[name] = function() {
          const start = Number(new Date);
          const result = fn.apply(this, arguments);
          const end = Number(new Date);
          Command.log(this[name], (end - start), arguments);
          return result;
        };
      } else {
        this.prototype[name] = fn;
      }

      // Set function displayName for debugging
      this.prototype[name].displayName = this._name + '#' + name;
      return this.prototype[name].toString = BaseObject.MethodToString;
    } else {
      return this.prototype[name];
    }
  });
  
  // Creates a method defined at both class and instance level
  def.classMethod('hybridMethod', function(name, fn) {
    this.classMethod(name, fn);
    return this.method(name, fn);
  });
  
  // Create matching init (instance) and create (class) constructor methods
  def.classMethod('initializer', function(name, fn) {
    if (fn) {
      name = ucFirst(name);
    } else {
      fn = name;
      name = '';
    }
    
    this.method(`init${name}`, fn);
    return this.classMethod(`create${name}`, function() {
      const object = new (this)();
      object[`init${name}`].apply(object, arguments);
      return object;
    });
  });
    
  // Include a module
  def.classMethod('include', function(definition) {
    definition(this)
  });
  
  def.classMethod('accessor', function(name) {
    const ucName = ucFirst(name);
    return this.method(name, function(value) {
      if (value !== undefined) {
        return this[`set${ucName}`](value);
      } else {
        return this[`get${ucName}`]();
      }
    });
  });
  
  // Creates getter, setter, and property accessor
  def.classMethod('property', function(name, mode) {
    const ucName = ucFirst(name);
    
    if (mode !== 'write') {
      this.method(`get${ucName}`, function() {
        return this[`_${name}`];
    });
    }
    
    if (mode !== 'read') {
      this.method(`set${ucFirst(name)}`, function(newValue) {
        const oldValue = this[`_${name}`];
        this[`_${name}`] = newValue;
        this._changed(name, oldValue, newValue);
        return this.trigger('changed', name, oldValue, newValue);
      });
    }
    
    return this.accessor(name);
  });
  
  // Generates a "forwarder" method, that acts as a proxy for the
  // given member object.
  def.classMethod('classDelegate', function(name, toObject, as) {
    return this.classMethod((as || name), function() {
      let through = this[toObject] || this[`_${toObject}`];
      if (through && through.call) { through = through.call(this); }
      if (through) {
        let attr = through[name];
        if (attr && attr.call) { attr = attr.apply(through, arguments); }
        return attr;
      }
    });
  });

  // Generates a "forwarder" method, that acts as a proxy for the
  // given member object.
  def.classMethod('delegate', function(name, toObject, as) {
    return this.method((as || name), function() {
      let through = this[toObject] || this[`_${toObject}`];
      if (through && through.call) { through = through.call(this); }
      if (through) {
        let attr = through[name];
        if (attr && attr.call) { attr = attr.apply(through, arguments); }
        return attr;
      }
    });
  });
      
  // Creates a "singleton pattern" class, with a method ".instance" which
  // always returns the same instance of class.
  def.classMethod('singleton', function() {
    return this.classMethod('instance', function() {
      return this._instance || (this._instance = this.create.apply(this, arguments));
    });
  });
    
  def.UID = 0;
  
  def.initializer(function() {
    return this._uid = BaseObject.UID++;
  });

  def.method('toString', function() { return `<${this._class._name} #${this._uid}>`; });
  
  def.method('_changed', function(name, oldValue, newValue) {
    const key = `_${name}Changed`;
    if (this[key] && this[key].call) { return this[key](oldValue, newValue); }
  });
  
  def.method('set', function(keys, value=null) {
    if (value) {
      return this.setKey(keys, value);
    } else {
      return (() => {
        const result = [];
        for (let key in keys) {
          value = keys[key];
          result.push(this.setKey(key, value));
        }
        return result;
      })();
    }
  });
  
  def.method('setKey', function(key, value) {
    const a = key.split('.');
    const here = a.shift();
    const there = a.join('.');
    const ucHere = ucFirst(here);
    
    if (there && there.length) {
      const that = this[`get${ucHere}`] ?
        this[`get${ucHere}`]()
      :
        this[here];
      
      if (that === null) {
        return null;
      } else if (that.setKey) {
        return that.setKey(there, value);
      } else {
        return BaseObject.method('setKey').call(that, there, value);
      }
    } else {
      if (this[`set${ucHere}`]) {
        return this[`set${ucHere}`](value);
      } else {
        return this[here] = value;
      }
    }
  });
  
  def.method('get', function(key) {
    const a = key.split('.');
    const here = a.shift();
    const there = a.join('.');
    
    const that = this[here] && this[here]();
    
    if (there && there.length) {
      if (that === null) {
        return null;
      } else if (that.get) {
        return that.get(there);
      } else {
        return BaseObject.method('get').call(that, there);  
      }
    } else {
      return that;
    }
  });
  
  // Produces a function that calls the named method on this object
  def.method('method', function(name) {
    const self = this;
    return function() { return self[name].apply(self, arguments); };
  });
    
  def.hybridMethod('bind', function(trigger, receiver, selector) {
    if (!this._bindings) { this._bindings = {}; }
    if (!this._bindings[trigger]) { this._bindings[trigger] = []; }
    if ((typeof receiver === 'function') && (receiver[selector || trigger] === undefined)) {
      return this._bindings[trigger].push({ fn: receiver });
    } else {
      if (!receiver._boundTo) { receiver._boundTo = []; }
      receiver._boundTo.push({source: this, trigger});
      return this._bindings[trigger].push({
        receiver,
        selector: selector || trigger
      });
    }
  });
  
  def.hybridMethod('unbindOne', function(trigger, receiver) {
    if (this._bindings && this._bindings[trigger]) {
      const bindings = this._bindings[trigger];
      let i = 0;
      return (() => {
        const result = [];
        while (bindings[i]) {
          if (bindings[i].receiver === receiver) {
            bindings[i].destroyed = true;
            bindings.splice(i, 1);
          }
          result.push(i++);
        }
        return result;
      })();
    }
  });
  
  def.hybridMethod('unbindAll', function(receiver) {
    if (this._bindings) {
      return (() => {
        const result = [];
        for (let trigger in this._bindings) {
          result.push(this.unbindOne(trigger, receiver));
        }
        return result;
      })();
    }
  });
  
  def.hybridMethod('unbind', function(trigger, receiver) {
    if (receiver != null) {
      return this.unbindOne(trigger, receiver);
    } else {
      return this.unbindAll(trigger);
    }
  });
  
  def.hybridMethod('isBound', function() {
    if (this._bindings) {
      for (let trigger in this._bindings) {
        if (this._bindings.hasOwnProperty(trigger)) {
          return true;
        }
      }
    }
    return false;
  });
  
  def.hybridMethod('trigger', function(trigger, ...passArgs) {
    if (this._bindings && this._bindings[trigger]) {
      // Use #slice to make a copy of bindings before we start calling them,
      // prevents issues when a bound callback alters bindings during its execution
      return (() => {
        const result = [];
        for (let binding of Array.from(this._bindings[trigger].slice(0))) {
          if (!binding.destroyed) {
            if (binding.fn) {
              result.push(binding.fn(this, ...Array.from(passArgs)));
            } else if (binding.receiver[binding.selector]) {
              result.push(binding.receiver[binding.selector](this, ...Array.from(passArgs)));
            } else {
              result.push(error(`Error triggering binding from ${this}: ${trigger} to ${binding.receiver}.${binding.selector}`));
            }
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }
  });
  
  def.method('error', function(message) {
    // Call an undefined method to trigger a javascript exception
    return this.causeAnException();
  });
});
