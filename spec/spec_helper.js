function mock(type, properties)
{
    var object = STObject.create();
    if (properties) {
        for (var key in properties) {
            object.set(key, properties[key]);
        }
    }
    return object;
}

Screw.Matchers['be'] = {
    match: function(expected, actual)
    {
        return (expected && actual && expected._uid && actual._uid && expected._uid == actual._uid);
    },
    failure_message: function(expected, actual, not) {
        return 'expected ' + String(actual) + ' to be ' + String(expected);
    }
};

STObject.prototype.should = function(matcher, expected) {
    return matchers.expect(this).to(matcher, expected);
};

STObject.prototype.shouldNotReceive = function(message) {
    this[message] = function() {
        throw(String(this) + ' should not have received ' + message + '(), but it did');
    };
};

(function() {
    var promises = [];

    function makePromise(message)
    {
        promises.push(message);
        return promises.length - 1;
    }
    function keepPromise(id)
    {
        if (promises[id]) {
            promises[id] = null;
        }
    }
    Screw.Matchers['resolve'] = function() {
        var thesePromises = promises;
        promises = [];
        for (var i = 0; i < thesePromises.length; i++) {
            if (thesePromises[i] !== null) {
                throw(thesePromises[i]);
            }
        }
    }
    
    STObject.prototype.shouldReceive = function(message) {
        var promise = makePromise(String(this) + ' should have received ' + message + '()');
        var oldFunction = this[message];
        this[message] = function() {
            keepPromise(promise);
            if (oldFunction) oldFunction.apply(this, arguments);
        };
    };
    
})();