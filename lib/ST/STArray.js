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

STArray.prototype.releaseAndEmpty = function() {
    this.each(ST.P('release')).length = 0;
    return this;
};

STArray.prototype.last = function()
{
    if (this.length == 0) return null;
    return this[this.length-1];
};

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

STArray.prototype.map = function(fun, thisp)
{
    var fun = ST.P(fun);
    
    var res = new STArray();
    for (var i = 0; i < this.length; i++) {
        res.push(fun.call(thisp || null, this[i], i, this));
    }
    return res;
};

STArray.prototype.mapToStdArray = function(fun, thisp)
{
    var fun = ST.P(fun);
    
    var res = [];
    for (var i = 0; i < this.length; i++) {
        res.push(fun.call(thisp || null, this[i], i, this));
    }
    return res;
};

STArray.prototype.toStdArray = function()
{
    var res = [];
    for (var i = 0; i < this.length; i++) {
        res.push(this[i]);
    }
    return res;
};

STArray.prototype.sum = function()
{
    var c = 0;
    for (var i = 0; i < this.length; i++) {
        c += this[i];
    }
    return c;
};

STArray.prototype.append = function(array)
{
    this.push.apply(this, array);
    return this;
};

STArray.prototype.remove = function(object)
{
    for (i = 0; i < this.length; i++) {
        if (this[i] == object) {
            this.splice(i--, 1);
        }
    }
};

STArray.prototype.removeAtIndex = function(index)
{
    this.splice(index, 1);
};

STArray.prototype.find = function(callback)
{
    for (var i = 0; i < this.length; i++) {
        if (callback.call(this[i], this[i])) return this[i];
    }
    return null;
};

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

STArray.prototype.copy = function()
{
    return this.slice();
};

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
