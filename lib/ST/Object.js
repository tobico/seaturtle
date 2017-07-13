/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST

ST.class('Object', null, function() {
  // Don't include ST.Object methods when profiling
  this._unlogged = true;
  
  // Used to override an existing method of an STObject. Allows the overriding
  // method to call the overridden method using `@super()`, no matter how
  // many methods are chained together.
  this.OverrideMethod = (oldMethod, newMethod) =>
    function() {
      const oldSuper = this.super || null;
      this.super = oldMethod;
      const result = newMethod.apply(this, arguments);
      this.super = oldSuper;
      return result;
    }
  ;
  
  this.MethodToString = function() { return this.displayName; };
  
  // Override or assign class method
  this.classMethod = function(name, fn) {
    if (this[name]) {
      return this[name] = ST.Object.OverrideMethod(this[name], fn);
    } else {
      this[name] = fn;
      return this._classMethods.push(name);
    }
  };
  this._classMethods.push('classMethod');
  
  // Override or assign instance method
  this.classMethod('method', function(name, fn) {
    if (fn != null) {
      if (this._superclass && this._superclass.prototype[name]) {
        this.prototype[name] = ST.Object.OverrideMethod(this._superclass.prototype[name], fn);
      } else if (ST._logging && !this._unlogged) {
        this.prototype[name] = function() {
          const start = Number(new Date);
          const result = fn.apply(this, arguments);
          const end = Number(new Date);
          if (ST._command) { ST._command.log(this[name], (end - start), arguments); }
          return result;
        };
      } else {
        this.prototype[name] = fn;
      }

      // Set function displayName for debugging
      this.prototype[name].displayName = this._name + '#' + name;
      return this.prototype[name].toString = ST.Object.MethodToString;
    } else {
      return this.prototype[name];
    }
});
  
  // Creates a method defined at both class and instance level
  this.classMethod('hybridMethod', function(name, fn) {
    this.classMethod(name, fn);
    return this.method(name, fn);
  });
  
  // Create matching init (instance) and create (class) constructor methods
  this.classMethod('initializer', function(name, fn) {
    if (fn) {
      name = ST.ucFirst(name);
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
  this.classMethod('include', function(module) {
    if (module._included) {
      return Array.from(module._included).map((definition) =>
        definition.call(this));
    }
  });
  
  this.classMethod('accessor', function(name) {
    const ucName = ST.ucFirst(name);
    return this.method(name, function(value) {
      if (value !== undefined) {
        return this[`set${ucName}`](value);
      } else {
        return this[`get${ucName}`]();
      }
    });
  });
  
  // Creates getter, setter, and property accessor
  this.classMethod('property', function(name, mode) {
    const ucName = ST.ucFirst(name);
    
    if (mode !== 'write') {
      this.method(`get${ucName}`, function() {
        return this[`_${name}`];
    });
    }
    
    if (mode !== 'read') {
      this.method(`set${ST.ucFirst(name)}`, function(newValue) {
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
  this.classMethod('classDelegate', function(name, toObject, as) {
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
  this.classMethod('delegate', function(name, toObject, as) {
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
  this.classMethod('singleton', function() {
    return this.classMethod('instance', function() {
      return this._instance || (this._instance = this.create.apply(this, arguments));
    });
  });
    
  this.UID = 0;
  
  this.initializer(function() {
    return this._uid = ST.Object.UID++;
  });

  this.method('toString', function() { return `<${this._class._name} #${this._uid}>`; });
  
  this.method('_changed', function(name, oldValue, newValue) {
    const key = `_${name}Changed`;
    if (this[key] && this[key].call) { return this[key](oldValue, newValue); }
  });
  
  this.method('set', function(keys, value=null) {
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
  
  this.method('setKey', function(key, value) {
    const a = key.split('.');
    const here = a.shift();
    const there = a.join('.');
    const ucHere = ST.ucFirst(here);
    
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
        return ST.Object.method('setKey').call(that, there, value);
      }
    } else {
      if (this[`set${ucHere}`]) {
        return this[`set${ucHere}`](value);
      } else {
        return this[here] = value;
      }
    }
  });
  
  this.method('get', function(key) {
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
        return ST.Object.method('get').call(that, there);  
      }
    } else {
      return that;
    }
  });
  
  // Produces a function that calls the named method on this object
  this.method('method', function(name) {
    const self = this;
    return function() { return self[name].apply(self, arguments); };
  });
    
  this.hybridMethod('bind', function(trigger, receiver, selector) {
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
  
  this.hybridMethod('unbindOne', function(trigger, receiver) {
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
  
  this.hybridMethod('unbindAll', function(receiver) {
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
  
  this.hybridMethod('unbind', function(trigger, receiver) {
    if (receiver != null) {
      return this.unbindOne(trigger, receiver);
    } else {
      return this.unbindAll(trigger);
    }
  });
  
  this.hybridMethod('isBound', function() {
    if (this._bindings) {
      for (let trigger in this._bindings) {
        if (this._bindings.hasOwnProperty(trigger)) {
          return true;
        }
      }
    }
    return false;
  });
  
  this.hybridMethod('trigger', function(trigger, ...passArgs) {
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
              result.push(ST.error(`Error triggering binding from ${this}: ${trigger} to ${binding.receiver}.${binding.selector}`));
            }
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }
  });
  
  return this.method('error', function(message) {
    // Call an undefined method to trigger a javascript exception
    return this.causeAnException();
  });
});

if (window.Spec) { Spec.extend(ST.Object); }