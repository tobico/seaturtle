import { BaseObject } from './base-object'
import { makeClass } from '../core/make-class'
import { toProc } from '../util/to-proc'
import { makeSortFn } from '../util/make-sort-fn'

export const List = makeClass('List', BaseObject, (def) => {
  def.initializer(function() {
    this.super();
    this._array = [];
    return this._retains = true;
  });

  def.initializer('withArray', function(array) {
    this.init();
    return this._array = array;
  });

  def.property('retains');

  def.method('toArray', function() {
    return this._array.splice(0)
  });

  def.method('each', function(fn) {
    fn = toProc(fn);
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
  def.method('eachAsync', function(fn, options) {
    if (options == null) { options = {}; }
    const self  = this;
    fn    = toProc(fn);

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

  def.method('getAt', function(index) {
    if ((index >= 0) && (index < this._array.length)) {
      return this._array[Number(index)];
    } else {
      return null;
    }
  });

  def.method('at', function(index, value) {
    if (arguments.length === 2) {
      return this.setAt(index, value);
    } else {
      return this.getAt(index);
    }
  });

  def.delegate('indexOf',  'array');
  def.delegate('sort',     'array');
  def.delegate('length',   'array', 'count');

  def.method('isEmpty', function() { return !this._array.length; });

  def.method('count', function() {
    return this._array.length;
  });

  def.method('last', function() {
    if (this._array.length) {
      return this._array[this._array.length - 1];
    } else {
      return null;
    }
  });

  def.method('add', function(object) {
    return this.insertAt(this._array.length, object);
  });

  def.method('insertAt', function(index, object) {
    if (object && object.retain && this._retains) { object.retain(); }
    this._array.splice(index, 0, object);
    if (object && object.bind) { object.bind('changed', this, 'itemChanged'); }
    return this.trigger('itemAdded', object, index);
  });

  def.method('addAndRelease', function(object) {
    this.add(object);
    if (object && object.release && this._retains) { return object.release(); }
  });

  def.method('removeAt', function(index) {
    if (!(this._array.length > index)) { return false; }
    const object = this._array.splice(index, 1)[0];
    if (object && object.unbind) { object.unbind('changed', this); }
    this.trigger('itemRemoved', object, index);
    if (object && object.release && this._retains) { object.release(); }
    return true;
  });

  def.method('removeLast', function() {
    if (this._array.length > 0) {
      return this.removeAt(this._array.length - 1);
    } else {
      return false;
    }
  });

  def.method('remove', function(object) {
    const index = this._array.indexOf(object);
    return (index >= 0) && this.removeAt(index);
  });

  // Add all items in another list to this one
  def.method('append', function(list) {
    const self = this;
    return list.each(item => self.add(item));
  });

  def.method('copy', function() {
    const newList = this._class.create();
    for (let object of Array.from(this._array)) {
      newList.add(object);
    }
    return newList;
  });

  def.method('empty', function() {
    return (() => {
      const result = [];
      while (this._array.length) {
        result.push(this.removeLast());
      }
      return result;
    })();
  });

  def.method('sortBy', function(fn) {
    return this.sort(makeSortFn(toProc(fn)));
  });

  def.method('itemChanged', function(item, attr, oldValue, newValue) {
    return this.trigger('itemChanged', item, attr, oldValue, newValue);
  });
});


export const Enumerable = (def) => {
  // Returns first item in collection
  def.method('first', function() {
    let value = null;
    this.each(function(item) {
      value = item;
      return 'break';
    });
    return value;
  });

  def.method('at', function(index) {
    let i = 0;
    let found = null;
    this.each(function(item) {
      if (i === index) {
        found = item;
        return 'break';
      } else {
        return i++;
      }
    });
    return found;
  });

  // Returns the index of specified item, or -1 if not found
  def.method('indexOf', function(target) {
    let found = -1;
    let index = 0;
    this.each(function(item) {
      if (item === target) {
        found = index;
        return 'break';
      } else {
        return index++;
      }
    });
    return found;
  });

  // Returns true if this contains the specified item.
  def.method('has', function(target) {
    return this.indexOf(target) > -1;
  });

  // Returns true if callback function for at least one array member returns
  // true.
  def.method('any', function(fn=null) {
    if (fn) { fn = toProc(fn); }

    let found = false;
    this.each(function(item) {
      if (!fn || fn(item)) {
        found = true;
        return 'break';
      }
    });
    return found;
  });

  // Returns true if callback function for every array member returns true.
  def.method('all', function(fn) {
    fn = toProc(fn);

    let found = true;
    this.each(function(item) {
      if (!fn(item)) {
        found = false;
        return 'break';
      }
    });
    return found;
  });

  // Runs callback for each item, with index of item in second argument
  def.method('eachWithIndex', function(fn) {
    let i = 0;
    return this.each(function(item) { return fn.call(this, item, i++); });
  });

  // Returns a new list with callback function applied to each item
  def.method('map', function(fn=null) {
    if (fn) { fn = toProc(fn); }
    const list = List.create();
    list.retains(false);
    this.each(function(item) {
      if (fn) { item = fn(item); }
      return list.add(item);
    });
    return list;
  });

  // Returns an array with callback function applied to each item
  def.method('mapArray', function(fn=null) {
    if (fn) { fn = toProc(fn); }
    const array = [];
    this.each(function(item) {
      if (fn) { item = fn(item); }
      return array.push(item);
    });
    return array;
  });

  // Returns sum of all items.
  def.method('sum', function(initial) {
    let count = initial || 0;
    this.each(item => count += item);
    return count;
  });

  // Returns the first item where callback(item) evaluates true
  def.method('find', function(fn) {
    fn = toProc(fn);
    let found = null;
    this.each(function(item) {
      if (fn(item)) {
        found = item;
        return 'break';
      }
    });
    return found;
  });

  // Returns a new list with no duplicates
  def.method('unique', function() {
    const list = List.create();
    this.each(function(item) {
      if (!list.has(item)) { return list.add(item); }
    });
    return list;
  });

  // Returns a new list containing only items where callback returns true
  def.method('collect', function(fn) {
    fn = toProc(fn);
    const list = List.create();
    this.each(function(item) {
      if (fn(item)) { return list.add(item); }
    });
    return list;
  });

  // Returns a new list containing only items where callback returns false
  def.method('reject', function(fn) {
    fn = toProc(fn);
    const list = List.create();
    this.each(function(item) {
      if (!fn(item)) { return list.add(item); }
    });
    return list;
  });

  // Returns a new list with callback items in reverse order
  def.method('reverse', function() {
    const list = List.create();
    list.retains(false);
    this.each(item => list.insertAt(0, item));
    return list;
  });

  // Returns lowest value
  def.method('min', function(fn) {
    fn = fn && toProc(fn);
    let value = null;
    this.each(function(item) {
      if (fn) { item = fn(item); }
      if ((item < value) || (value === null)) { return value = item; }
    });
    return value;
  });

  // Returns highest value
  def.method('max', function(fn) {
    fn = fn && toProc(fn);
    let value = null;
    this.each(function(item) {
      if (fn) { item = fn(item); }
      if ((value === null) || (item > value)) { return value = item; }
    });
    return value;
  });
}

List.include(Enumerable)
