/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
ST.module('Enumerable', function() {
  // Returns first item in collection
  this.method('first', function() {
    let value = null;
    this.each(function(item) {
      value = item;
      return 'break';
    });
    return value;
  });
  
  this.method('at', function(index) {
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
  this.method('indexOf', function(target) {
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
  this.method('has', function(target) {
    return this.indexOf(target) > -1;
  });

  // Returns true if callback function for at least one array member returns
  // true.
  this.method('any', function(fn=null) {
    if (fn) { fn = ST.toProc(fn); }
    
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
  this.method('all', function(fn) {
    fn = ST.toProc(fn);
    
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
  this.method('eachWithIndex', function(fn) {
    let i = 0;
    return this.each(function(item) { return fn.call(this, item, i++); });
  });
  
  // Returns a new list with callback function applied to each item
  this.method('map', function(fn=null) {
    if (fn) { fn = ST.toProc(fn); }
    const list = ST.List.create();
    list.retains(false);
    this.each(function(item) {
      if (fn) { item = fn(item); }
      return list.add(item);
    });
    return list;
  });
  
  // Returns an array with callback function applied to each item
  this.method('mapArray', function(fn=null) {
    if (fn) { fn = ST.toProc(fn); }
    const array = [];
    this.each(function(item) {
      if (fn) { item = fn(item); }
      return array.push(item);
    });
    return array;
  });

  // Returns sum of all items.
  this.method('sum', function(initial) {
    let count = initial || 0;
    this.each(item => count += item);
    return count;
  });
  
  // Returns the first item where callback(item) evaluates true
  this.method('find', function(fn) {
    fn = ST.toProc(fn);
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
  this.method('unique', function() {
    const list = ST.List.create();
    this.each(function(item) {
      if (!list.has(item)) { return list.add(item); }
    });
    return list;
  });
  
  // Returns a new list containing only items where callback returns true
  this.method('collect', function(fn) {
    fn = ST.toProc(fn);
    const list = ST.List.create();
    this.each(function(item) {
      if (fn(item)) { return list.add(item); }
    });
    return list;
  });

  // Returns a new list containing only items where callback returns false
  this.method('reject', function(fn) {
    fn = ST.toProc(fn);
    const list = ST.List.create();
    this.each(function(item) {
      if (!fn(item)) { return list.add(item); }
    });
    return list;
  });

  // Returns a new list with callback items in reverse order
  this.method('reverse', function() {
    const list = ST.List.create();
    list.retains(false);
    this.each(item => list.insertAt(0, item));
    return list;
  });
  
  // Returns lowest value
  this.method('min', function(fn) {
    fn = fn && ST.toProc(fn);
    let value = null;
    this.each(function(item) {
      if (fn) { item = fn(item); }
      if ((item < value) || (value === null)) { return value = item; }
    });
    return value;
  });
    
  // Returns highest value
  return this.method('max', function(fn) {
    fn = fn && ST.toProc(fn);
    let value = null;
    this.each(function(item) {
      if (fn) { item = fn(item); }
      if ((value === null) || (item > value)) { return value = item; }
    });
    return value;
  });
});