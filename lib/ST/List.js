/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Object
//= require ST/Enumerable

ST.class('List', function() {
  this.include(ST.Enumerable);

  this.initializer(function() {
    this.super();
    this._array = [];
    return this._retains = true;
  });
  
  this.initializer('withArray', function(array) {
    this.init();
    return this._array = array;
  });
  
  this.property('retains');
    
  this.method('each', function(fn) {
    fn = ST.toProc(fn);
    return (() => {
      const result = [];
      for (let item of Array.from(this._array)) {
        if (fn.call(item, item) === 'break') { break; } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  });

  // Runs the specified callback function for each item, in an
  // asynchronous manner.
  //
  // Options:
  //   done:           callback to call when all complete
  //   steps:          total number of synchronous steps to take       
  //   or  iteration:  number of items to process in each iteration
  this.method('eachAsync', function(fn, options) {
    if (options == null) { options = {}; }
    const self  = this;
    fn    = ST.toProc(fn);

    let iteration = 1;
    if (options.steps) { iteration = Math.round(this._array.length / options.steps); }
    if (options.iteration) { ({ iteration } = options); }
    if (iteration < 1) { iteration = 1; }

    let i = 0;
    let _loop = iteration - 1;
    var step = function() {
      fn.call(options.object || null, self._array[i], i);
      i++;
      if (i < self._array.length) {
        if (_loop > 0) {
          _loop--;
          return step();
        } else {
          _loop = iteration - 1;
          return setTimeout(step, 1);
        }
      } else if (options.done) {
        return setTimeout(options.done, 1);
      }
    };
    return setTimeout(step, 1);
  });
  
  this.method('getAt', function(index) {
    if ((index >= 0) && (index < this._array.length)) {
      return this._array[Number(index)];
    } else {
      return null;
    }
  });
  
  this.method('at', function(index, value) {
    if (arguments.length === 2) {
      return this.setAt(index, value);
    } else {
      return this.getAt(index);
    }
  });
    
  this.delegate('indexOf',  'array');
  this.delegate('sort',     'array');
  this.delegate('length',   'array', 'count');
  
  this.method('isEmpty', function() { return !this._array.length; });
  
  this.method('count', function() {
    return this._array.length;
  });
  
  this.method('last', function() {
    if (this._array.length) {
      return this._array[this._array.length - 1];
    } else {
      return null;
    }
  });
  
  this.method('add', function(object) {
    return this.insertAt(this._array.length, object);
  });
  
  this.method('insertAt', function(index, object) {
    if (object && object.retain && this._retains) { object.retain(); }
    this._array.splice(index, 0, object);
    if (object && object.bind) { object.bind('changed', this, 'itemChanged'); }
    return this.trigger('itemAdded', object, index);
  });
  
  this.method('addAndRelease', function(object) {
    this.add(object);
    if (object && object.release && this._retains) { return object.release(); }
  });
  
  this.method('removeAt', function(index) {
    if (!(this._array.length > index)) { return false; }
    const object = this._array.splice(index, 1)[0];
    if (object && object.unbind) { object.unbind('changed', this); }
    this.trigger('itemRemoved', object, index);
    if (object && object.release && this._retains) { object.release(); }
    return true;
  });
    
  this.method('removeLast', function() {
    if (this._array.length > 0) {
      return this.removeAt(this._array.length - 1);
    } else {
      return false;
    }
  });
  
  this.method('remove', function(object) {
    const index = this._array.indexOf(object);
    return (index >= 0) && this.removeAt(index);
  });
    
  // Add all items in another list to this one
  this.method('append', function(list) {
    const self = this;
    return list.each(item => self.add(item));
  });

  this.method('copy', function() {
    const newList = this._class.create();
    for (let object of Array.from(this._array)) {
      newList.add(object);
    }
    return newList;
  });
  
  this.method('empty', function() {
    return (() => {
      const result = [];
      while (this._array.length) {
        result.push(this.removeLast());
      }
      return result;
    })();
  });
  
  this.method('sortBy', function(fn) {
    return this.sort(ST.makeSortFn(ST.toProc(fn)));
  });
  
  return this.method('itemChanged', function(item, attr, oldValue, newValue) {
    return this.trigger('itemChanged', item, attr, oldValue, newValue);
  });
});