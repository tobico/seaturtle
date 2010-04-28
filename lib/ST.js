ST = {};

/**
 * Helper functions to create DOM elements. Call using inputTag(), etc..
 *
 * Accepts any number of jQuery objects as parameters, which will be added
 * as children to the new element.
 *
 * @params {jQuery|DOMElement} children
 * @returns {jQuery} Element
 */
$.each(['a', 'address', 'area', 'article', 'aside', 'abbr', 'audio', 'b',
    'base', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas',
    'caption', 'cite', 'code', 'col', 'colgroup', 'command', 'datalist',
    'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em',
    'embed', 'fieldset', 'figure', 'footer', 'form', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i',
    'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend',
    'li', 'link', 'map', 'mark', 'menu', 'meta', 'meter', 'nav',
    'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre',
    'progress', 'q', 'rp', 'rt', 'ruby', 'samp', 'script', 'section',
    'select', 'small', 'source', 'span', 'strong', 'style', 'sub',
    'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead',
    'time', 'title', 'tr', 'ul', 'var', 'video'], function()
{    
    var tag = this;
    ST[tag + 'Tag'] = function() {
        var element = $(document.createElement(tag));
        if (tag == 'a') {
            element.attr('href', 'javascript:;');
        }
        if (arguments.length > 0) {
            for (var i = 0; i < arguments.length; i++) {
                element.append(arguments[i]);
            }
        }
        return element;
    }
});

/**
 * Creates a custom DOM element with specified name.
 *
 * @param {String} name
 * @returns {jQuery} element
 */
ST.customTag = function(name)
{
    return $(document.createElement(name));
};

/**
 * Converts a string to a function returns the named attribute of it's first
 * parameter, or (this) object.
 * 
 * If given attribute is a function, it will be called with any additional
 * arguments provided to stringToProc, and the result returned.
 *
 * @param {String} string String to convert
 * @returns {Function} Function
 */ 
ST.stringToProc = function(string)
{
    if (arguments.length > 1) {
        var passArgs = Array.prototype.slice.call(arguments, 1);
    } else {
        passArgs = [];
    }
    
    return function(o)
    {
        if (this && this[string] !== undefined) {
            if (this[string] && this[string].apply) {
                return this[string].apply(this, passArgs);
            } else {
                return this[string];
            }
        } else if (o && o[string] !== undefined) {
            if (o[string] && o[string].apply) {
                return o[string].apply(o, passArgs);
            } else {
                return o[string];
            }
        } else {
            return null;
        }
    };
};

/**
 * Converts an object to a function.
 * 
 * If the passed object is a string, it will be converted using 
 * ST.stringToProc.
 *
 * @param {Object} object Object to convert
 * @returns {Function} Function
 */
ST.P = ST.toProc = function(object)
{
    if (object.call) {
        return object;
    } else if (typeof object === 'string') {
        return ST.stringToProc(object);
    } else {
        ST.error('Could not convert object to Proc');
    }
};

/**
 * Creates a new STArray
 * 
 * @param {Array} to convert
 * @params {Object} Objects to add to array
 */
ST.A = ST.array = function(array) {
    if (array && array.push) return new STArray().append(array);
    else return new STArray().append(arguments);
};

/**
 * Traverse an object using the given path (delimited by `:`)
 */
ST.navigate = function(hash, path)
{
    a = path.split(':');
    var o = hash;
    for (var i = 0; i < a.length; i++) {
        if (o && o[a[i]]) {
            o = o[a[i]];
        } else {
            return null;
        }
    }
    return o;
};

/**
 * Returns localization string. If vars are supplied, they will be
 * substituted into string using EJS.
 * 
 * @param {String} key Path to localization string.
 * @param {Object} vars Hash of variables to pass to EJS
 * @returns {String} Localized string
 */
ST.L = ST.locale = function(key, vars) {
    var l;
    if (LANG[key]) {
        l = LANG[key];
    } else {
        l = ST.navigate(LANG, key);
    }
    
    if (vars) {
        return new EJS({text: l}).render(vars);
    } else {
        return l;
    }
};

/* makeClass functions */

/**
 * Used to override an existing method of an STObject. Allows the overriding
 * method to call the overridden method using `this._super`, no matter how
 * many methods are chained together.
 *
 * If the method does not return a value, the STObject the method was called
 * will be returned, to allow chaining of methods
 *
 * @param {Function} oldMethod Method to override
 * @param {Function} newMethod Overriding method
 * @returns {Function} Chained method
 */
ST.overrideMethod = function(oldMethod, newMethod)
{
    return function() {
        var _super = this._super || null;
        this._super = oldMethod;
        var result = newMethod.apply(this, arguments);
        this._super = _super;
        if (result === undefined) return this;
        return result;
    };
};

/**
 * Wraps the given function into a chainable method.
 *
 * If the method does not return a value, the STObject the method was called
 * will be returned, to allow chaining of methods
 *
 * @param {Function} fn Function to convert to method
 * @returns {Function} Method with chaining support.
 */
ST.chainMethod = function(fn)
{
    return function() {
        var result = fn.apply(this, arguments);
        if (result === undefined) return this;
        return result;
    };
};

/**
 * Creates an object constructor, based on the given initializer method.
 *
 * @param {String} init Name of initializer method.
 * @returns {Function} `create` method
 */
ST.makeCreateFn = function(init)
{
    return function() {
        var o = new this;
        return o[init].apply(o, arguments);
    };
},
ST.createFn = ST.makeCreateFn('init');

/**
 * Creates a new class. This would normally be called as a result of calling
 * STObject.subClass().
 *
 * @param {string} name Name of new class
 * @param {object} superClass Class to inherit from (optional)
 * @param {object} members Hash of object members, including instance methods
 *  and variables (starting with lowercase), class methods and variables
 *  (starting with uppercase), and generators.
 */
ST.makeClass = function(name, superClass, members) {
    var f = function() { this.$ = f; return this; };
    if (superClass) {
        f.prototype = new superClass;
        f.$ = superClass;
        f.create = ST.createFn;
    }
    f._name = name;
    window[name] = f;
    
    f.subClass = function(name, members) {
        ST.makeClass(name, f, members);
    };
    
    if (!members) return;
    if (members.end !== undefined) delete members.end;
    
    var generators = [];
    
    for (name in members) {
        if (members[name]._generator) {
            generators[name] = members[name]._generator;
        } else if (name.match(/^[A-Z]/)) {
            f[name] = members[name];  
        } else {
            if (superClass && superClass.prototype[name]) {
                f.prototype[name] = ST.overrideMethod(superClass.prototype[name], members[name]);
            } else {
                f.prototype[name] = ST.chainMethod(members[name]);
            }
            if (name.match(/^initWith/)) {
                f[name.replace(/^initWith/, 'createWith')] = ST.makeCreateFn(name);
            }
            if (name == 'init') {
                f['create'] = ST.makeCreateFn(name);
            }
        }
    }
    
    for (name in generators) {
        generators[name](f, name);
    }
};

/**
 * Generates an abstract method, abstract methods must be overriden in
 * subclasses.
 */
ST.$abstract = function() {
    return {_generator: function(f, member) {
        if (!f.prototype[member]) {
            f.prototype[member] = function()
            {
                ST.error('Abstract function called');
            };
        }
    }};
}

/**
 * Generator - Creates a "virtual" method. This method does nothing, but
 * can be overridden in subclasses.
 */
ST.$virtual = function() {
    var expectedArgs = arguments.length;
    
    return {_generator: function(f, member) {
        if (!f.prototype[member]) {
            f.prototype[member] = function()
            {
                if (arguments.length != expectedArgs) {
                    ST.error(this.arguments.length + ' arguments supplied to virtual function, expected ' + expectedArgs);
                }
            };
        }
    }};
};

/**
 * Generator - Creates a property (accessors for ivars)
 * 
 * @param {String} method (Optional) Method to use for storing values. If set 
 *  to 'retain', STObjects being set will be automatically retained/released
 *  as needed.
 * @param {String} mode (Optional) Read/write mode. Set to (readonly) to
 *  generate no setter, set to (writeonly) to generate no getter.
 */
ST.$property = function(method, mode) {
    return {_generator: function(f, member) {
        if (!f.prototype['set' + ST.ucFirst(member)] && mode != 'readonly') {
            if (method == 'retain') {
                f.prototype['set' + ST.ucFirst(member)] = function(newValue) {
                    var oldValue = this[member];
                    if (newValue && newValue.retain) newValue.retain();
                    this[member] = newValue;
                    if (this._changed) this._changed(member, oldValue, newValue);
                    if (oldValue && oldValue.release) oldValue.release();
                    return this;
                };
            } else {
                f.prototype['set' + ST.ucFirst(member)] = function(newValue) {
                    var oldValue = this[member];
                    this[member] = newValue;
                    if (this._changed) this._changed(member, oldValue, newValue);
                    return this;
                };
            }
        }
        if (!f.prototype['get' + ST.ucFirst(member)] && mode != 'writeonly') {
            f.prototype['get' + ST.ucFirst(member)] = function() {
                return this[member];
            };
        }
    }};
};
ST.$property._generator = ST.$property()._generator;

/**
 * Generator - Generates a "forwarder" method, that acts as a proxy for the
 *  given member object.
 * @param {String} forwardObject Name of member to forward to
 * @param {String} forwardMethod (Optional) Name of method to forward to.
 *  Defaults to the same name as the forwarder method.
 */
ST.$forward = function(forwardObject, forwardMethod)
{
    return {_generator: function(f, member) {
        var callMethod = forwardMethod || member;
        f.prototype[member] = function() {
            if (this[forwardObject] && this[forwardObject][callMethod]) {
                var r = this[forwardObject][callMethod].apply(this[forwardObject], arguments);
                if (r === this[forwardObject]) r = this;
                return r;
            }
        };
    }};
}

/**
 * Generates a "trigger" method that triggers the given event when caled.
 *
 * @param {String} name Name of event to trigger
 */
ST.$trigger = function(name)
{
    return {_generator: function(f, member) {
        f.prototype[member] = function() {
            this.trigger(name);
        };
    }};
};

/* end makeClass functions */

/**
 * Instructs the browser to print the specified HTML content
 * 
 * @param {String} html HTML fragment to print
 * @param {String} title Page title
 * @param {String} stylesheet URL of stylesheet to apply to printed document.
 */
ST.printHTML = function(html, title, stylesheet)
{
    var s = "<!doctype html>\n<html><head><title>" + (title || '') + '</title>';
    if (stylesheet) {
        s += '<link type="text/css" rel="stylesheet" href="' + stylesheet + '" />';
    }
    s += '</head><body class="print" onload="print(); close();">' + html + '</body></html>';
    
    var useFrame = ($.browser.mozilla);
    
    if (useFrame) {
        if ($('#printFrame').length < 1)
            $('body').append('<iframe name="printFrame" id="printFrame" style="position: absolute; top : -1000px;"></iframe>');
        var o = frames['printFrame'] || document.getElementById('printFrame').contentWindow;
    } else {
        var o = window.open();
    }
    o.document.open();
    o.document.write(s);
    o.document.close();
    if (useFrame) o.print();
};

/**
 * Capitalizes the first letter of a string.
 * 
 * @param {String} s String to capitalize
 * @returns {String} Result
 */
ST.ucFirst = function(s)
{
    var x = String(s);
    return x.substr(0, 1).toUpperCase() + x.substr(1, x.length);
};

/**
 * Escapes a string for inclusion as a literal value in a regular expression.
 *
 * @param {String} text String to escape
 * @returns {String} Escaped string
 */
ST.reEscape = function(text)
{
    return String(text).replace(/\\|\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}|\^|\$/g, '\\$&');
};

/**
 * Truncates a string to the specified length, adding "..." to the end
 *
 * @param {String} text String to truncate
 * @param {Integer} length Length to truncate to
 * @returns {String} Truncated string
 */
ST.truncate = function(text, length)
{
    return (text.length < length)
        ? text
        : (text.substr(0, length-3) + '...');
}

/**
 * Spaceship operator (<=>) compares two values
 */
ST.spaceship = function(a, b)
{
    if (a > b) return 1;
    else if (a < b) return -1;
    else return 0;
};

/**
 * Creates an Array.sort compatible callback function from the provided
 *  conversion function.
 *
 * @param {Function} callback Function to convert array objects to comparable
 *   value
 * @param {Boolean} reverse (optional) Set to true to reverse sort order
 * @returns {Function} Sort function
 */
ST.makeSortFn = function(callback, reverse)
{
    return function(a, b) {
        return reverse ? -ST.spaceship(callback(a), callback(b)) : ST.spaceship(callback(a), callback(b));
    };
};

ST.error = function(message)
{
    if (console) {
        console.error(message);
    } else {
        alert(message);
    }
};