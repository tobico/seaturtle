function STArray()
{
    if (arguments.length) {
        this.append(arguments);
    }
    this.$ = STArray;
    return this;
}
STArray.prototype = new Array;

STArray.create = function()
{
    var a = new STArray();
    if (arguments.length) {
        a.append(arguments);
    }
    return a;
};

STArray.createWithArray = function(array)
{
    return new STArray().append(array);
};

/**
 * Runs the specified callback function for each item in this array.
 *
 * @param {Function} fun Callback function
 */
STArray.prototype.each = function(fun) {
    var fun = ST.P(fun);
    
    for (var i = 0; i < this.length; i++) {
        if (fun.call(this[i], this[i], i) == 'break') break;
    }
    
    return this;
};

/**
 * Removes all items from this array.
 */
STArray.prototype.empty = function()
{
    this.length = 0;
    return this;
};

/**
 * Calls the release method on each item, then removes all items in this Array.
 */
STArray.prototype.releaseAndEmpty = function() {
    this.each('release').length = 0;
    return this;
};

/**
 * Returns true if array is empty (contains no items).
 */
STArray.prototype.isEmpty = function()
{
    return this.length == 0;
};

/**
 * Returns last item in this array, or null if empty.
 */
STArray.prototype.last = function()
{
    if (this.length == 0) return null;
    return this[this.length-1];
};

/**
 * Returns true if array contains the specified item.
 */
STArray.prototype.has = function(object)
{
    return this.indexOf(object) >= 0;
};

/**
 * Returns true if callback function for at least one array member returns
 * true.
 * 
 * @param {Function} callback Callback function
 */
STArray.prototype.any = function(callback)
{
    for (var i = 0; i < this.length; i++) {
        if (callback.call(this[i], i)) return true;
    }
    return false;
};

/**
 * Returns true if callback function for every array member returns true.
 *
 * @param {Function} callback Callback function
 */
STArray.prototype.all = function(callback)
{
    for (var i = 0; i < this.length; i++) {
        if (!callback.call(this[i], i)) return false;
    }
    return true;
};

/**
 * Returns a new copy of array with callback function applied to each item.
 */
STArray.prototype.map = function(fun, thisp)
{
    var fun = ST.P(fun);
    
    var res = new STArray();
    for (var i = 0; i < this.length; i++) {
        res.push(fun.call(thisp || null, this[i], i, this));
    }
    return res;
};

/**
 * Maps all items through a callback function, and returns a standard Array
 * object.
 */
STArray.prototype.mapToStdArray = function(fun, thisp)
{
    var fun = ST.P(fun);
    
    var res = [];
    for (var i = 0; i < this.length; i++) {
        res.push(fun.call(thisp || null, this[i], i, this));
    }
    return res;
};

/**
 * Creates a copy of array as a standard Array object.
 */
STArray.prototype.toStdArray = function()
{
    var res = [];
    for (var i = 0; i < this.length; i++) {
        res.push(this[i]);
    }
    return res;
};

/**
 * Returns sum of all items.
 */
STArray.prototype.sum = function(initial)
{
    var c = initial || 0;
    for (var i = 0; i < this.length; i++) {
        c += this[i];
    }
    return c;
};

/**
 * Adds items in another array to the end of this one.
 */
STArray.prototype.append = function(array)
{
    this.push.apply(this, array);
    return this;
};

/**
 * Removes the given item from this array, if found,
 */
STArray.prototype.remove = function(object)
{
    for (i = 0; i < this.length; i++) {
        if (this[i] == object) {
            this.splice(i--, 1);
        }
    }
};

/**
 * Removes the item at the given index from this array.
 */
STArray.prototype.removeAtIndex = function(index)
{
    this.splice(index, 1);
};

/**
 * Returns the first item in this array where callback(item) evaluates true
 */
STArray.prototype.find = function(callback)
{
    for (var i = 0; i < this.length; i++) {
        if (callback.call(this[i], this[i])) return this[i];
    }
    return null;
};

/**
 * Removes all items from this array where callback(item) evaluates to true
 */
STArray.prototype.findRemove = function(callback)
{
    for (var i = 0; i < this.length; i++) {
        if (callback.call(this[i], this[i])) {
            this.splice(i, 1);
            i--;
        }
    }
    return null;
};

/**
 * Removes from array any items with index greater than specified index.
 */
STArray.prototype.trimTo = function(index)
{
    if (this.length > (index + 1)) {
        this.splice(index + 1, this.length - (index+1));
    }
};

/**
 * Returns a new array with the same items as this one (shallow copy).
 */
STArray.prototype.copy = function()
{
    return this.slice();
};

/**
 * Returns a new array containing items within the specified range.
 */
STArray.prototype.slice = function(from, length)
{
    var min = from || 0;
    var max = this.length - 1 - min;
    if (length) max = Math.min(max, min + length - 1);
    var a = STArray.create();
    for (var i = min; i <= max; i++) {
        a.push(this[i]);
    }
    return a;
};

/**
 * Returns a new array with no duplicates.
 */
STArray.prototype.unique = function()
{
    var h = {};
    for (var i = 0; i < this.length; i++) {
        h[this[i]] = true;
    }
    var a = new STArray();
    for (i in h) {
        a.push(i);
    }
    return a;
};

/**
 * Returns a new array containing only items where callback returns true
 */
STArray.prototype.collect = function(fun) {
    var fun = ST.P(fun);
    var a = new STArray();
    this.each(function(item) {
        if (fun.call(item, item)) a.push(item);
    });
    return a;
};

/**
 * Returns a new array containing only items where callback returns false
 */
STArray.prototype.reject = function(fun) {
    var fun = ST.P(fun);
    var a = new STArray();
    this.each(function(item) {
        if (!fun.call(item, item)) a.push(item);
    });
    return a;
};