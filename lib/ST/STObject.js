ST.makeClass('STObject', false, {
    AutoReleasePool: ST.A(),
    AutoReleaseObject: function(o)
    {
        if (STObject.AutoReleasePool.length == 0) {
            window.setTimeout(function() {
                STObject.AutoReleasePool.each(ST.P('release')).empty();
            }, 1);
        }
        STObject.AutoReleasePool.push(o);
    },
    
    UID: 0,
    
    init: function()
    {
        if (this.retainCount) ST.error('Object initialized twice: ' + this);
        this.retainCount = 1;
        this._uid = STObject.UID++;
    },
    
    conformsToProtocol: function(protocol)
    {
        var o = this;
        
        return protocol.all(function() {
            return o[this];
        });
    },
    
    destroy: function()
    {
        if (this.__proto__) this.__proto__ = Object;
        for (i in this) {
            delete this[i];
        }
    },
    
    toString: function()
    {
        return '<' + this.$._name + ' #' + this._uid + '>';
    },
    
    retain: function()
    {
        this.retainCount++;
        return this;
    },
    
    release: function()
    {
        this.retainCount--;
        if (this.retainCount == 0) {
            this.destroy();
            return null;
        } else {
            return this;
        }
    },
    
    releaseMembers: function()
    {
        var self = this;
        $.each(arguments, function() {
            if (self[this]) {
                if (self[this].release) {
                    self[this].release();
                }
                self[this] = null;
            }
        });
    },
    
    autorelease: function()
    {
        STObject.AutoReleaseObject(this);
    },
    
    _changed: function(member, oldValue, newValue)
    {
        var key = '_changed' + ST.ucFirst(member);
        if (this[key]) {
            this[key](oldValue, newValue);
        }
    },
    
    set: function(hash)
    {
        if (arguments.length == 2) {
            this.setKey.apply(this, arguments);
        } else {
            for (key in hash) {
                this.setKey(key, hash[key]);
            }
        }
    },
    
    setKey: function(key, value)
    {
        if (this['set' + ST.ucFirst(key)]) {
            this['set' + ST.ucFirst(key)].call(this, value);
        } else {
            this[key] = value;
        }
    },
    
    get: function(key)
    {
        if (this['get' + ST.ucFirst(key)]) {
            return this['get' + ST.ucFirst(key)].call(this);
        } else {
            return this[key];
        }
    },
    
    methodFn: function(method)
    {
        var self = this;
        return function() { return self[method].apply(self, arguments); };
    },
    
    bind: function(trigger, receiver, selector)
    {
        if (!this._bindings) this._bindings = {};
        if (!this._bindings[trigger]) this._bindings[trigger] = STArray.create();
        this._bindings[trigger].push({
            receiver: receiver,
            selector: selector || trigger
        });
    },
    
    unbind: function(trigger, receiver)
    {
        if (this._bindings && this._bindings[trigger]) {
            this._bindings[trigger].findRemove(function() {
                return this.receiver == receiver;
            });
        }
    },
    
    trigger: function()
    {
        if (!arguments.length) return;
        
        var passArgs = arguments;
        var trigger = passArgs[0];
        passArgs[0] = this;
        
        if (this._bindings && this._bindings[trigger]) {
            this._bindings[trigger].each(function(target) {
                target.receiver[target.selector].apply(target.receiver, passArgs);
            });
        }
    },
    
    scheduleMethod: function(method, options)
    {
        var self = this;
        options = options || {};
        
        window.setTimeout(function() {
            self[method].apply(self, options.args || []);
        }, options.delay || 1);
    },
    
    error: function(message)
    {
        //Call an undefined method to trigger a javascript exception
        this.causeAnException();
    },
    
    assert: function(result)
    {
        if (!result) this.error('Assertion failed');
    },

end:0});