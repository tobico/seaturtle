/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Object

ST.class('Destructable', 'Object', function() {
  this.initializer(function() {
    this.super();
    if (this._retainCount) { ST.error(`Object initialized twice: ${this}`); }
    return this._retainCount = 1;
  });

  this.classMethod('destructor', function(fn) {
    return this.method('destroy', fn);
  });

  // Creates getter, setter, and property accessor
  this.classMethod('retainedProperty', function(name, mode) {
    const ucName = ST.ucFirst(name);
    
    (this._retainedProperties || (this._retainedProperties = [])).push(name);

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
        if (oldValue !== newValue) {
          if (newValue) { newValue.retain(); }
          if (oldValue) { return oldValue.release(); }
        }
      });
    }

    return this.accessor(name);
  });
    
  this.destructor(function() {
    // Unbind any loose bindings
    if (this._boundTo) {
      for (let binding of Array.from(this._boundTo)) {
        if (!binding.source._destroyed) {
          binding.source.unbindOne(binding.trigger, this);
        }
      }
    }
    
    // Release any retained properties
    let c = this._class;
    while (c !== ST.Destructable) {
      if (c._retainedProperties) {
        for (let property of Array.from(c._retainedProperties)) {
          this[property](null);
        }
      }
      c = c._superclass;
    }
    
    if (this.__proto__) { this.__proto__ = Object; }
    for (let name in this) {
      if ((name !== '_class') && (name !== '_uid')) { delete this[name]; }
    }
    this._destroyed = true;
    return this.toString = function() { return `<Destroyed ${this._class._name} #${this._uid}>`; };
  });

  this.method('retain', function() {
    return this._retainCount++;
  });
  
  return this.method('release', function() {
    this._retainCount--;
    if (!this._retainCount) { return this.destroy(); }
  });
});