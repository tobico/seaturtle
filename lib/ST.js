ST = {};

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

ST.customTag = function(name)
{
    return $(document.createElement(name));
};

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

ST.A = ST.array = function(array) {
    if (array && array.push) return new STArray().append(array);
    else return new STArray().append(arguments);
};

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

ST.chainMethod = function(fn)
{
    return function() {
        var result = fn.apply(this, arguments);
        if (result === undefined) return this;
        return result;
    };
};

ST.makeCreateFn = function(init)
{
    return function() {
        var o = new this;
        return o[init].apply(o, arguments);
    };
},
ST.createFn = ST.makeCreateFn('init');

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
        }
    }
    
    for (name in generators) {
        generators[name](f, name);
    }
};

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

ST.$trigger = function(name)
{
    return {_generator: function(f, member) {
        f.prototype[member] = function() {
            this.trigger(name);
        };
    }};
};

/* end makeClass functions */

//Instructs the browser to print the specified HTML content
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


ST.ucFirst = function(s)
{
    var x = String(s);
    return x.substr(0, 1).toUpperCase() + x.substr(1, x.length);
};


ST.reEscape = function(text) {
    return String(text).replace(/\\|\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}|\^|\$/g, '\\$&');
};

/**
 * Spaceship operator (<=>) compares two values
 */
ST.spaceship = function(a, b)
{
    if (a > b) return 1;
    else if (a < b) return -1;
    else return 0;
};

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