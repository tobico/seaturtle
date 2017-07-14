import { BaseObject } from './base-object'
import { makeClass } from './make-class'
import { error } from '../util/error'
import { ucFirst } from '../util/uc-first'

export const Destructable = makeClass('Destructable', BaseObject, (def) => {
  def.initializer(function() {
    this.super();
    if (this._retainCount) { error(`Object initialized twice: ${this}`); }
    return this._retainCount = 1;
  });

  def.classMethod('destructor', function(fn) {
    return this.method('destroy', fn);
  });

  // Creates getter, setter, and property accessor
  def.classMethod('retainedProperty', function(name, mode) {
    const ucName = ucFirst(name);
    
    (this._retainedProperties || (this._retainedProperties = [])).push(name);

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
        if (oldValue !== newValue) {
          if (newValue) { newValue.retain(); }
          if (oldValue) { return oldValue.release(); }
        }
      });
    }

    return this.accessor(name);
  });
    
  def.destructor(function() {
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
    while (c !== Destructable) {
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

  def.method('retain', function() {
    return this._retainCount++;
  });
  
  def.method('release', function() {
    this._retainCount--;
    if (!this._retainCount) { return this.destroy(); }
  });
});
