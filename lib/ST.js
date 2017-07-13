/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _touch = navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/) !== null;
const _logging = !_touch && window.console && window.console.groupCollapsed;

window.ST = {
  _history: [],

  // Converts a string to a function returns the named attribute of it's first
  // parameter, or (this) object.
  //
  // If given attribute is a function, it will be called with any additional
  // arguments provided to stringToProc, and the result returned.
  stringToProc(string, passArgs) {
    if (passArgs == null) { passArgs = []; }
    return function(o) {
      if (o && (o[string] !== undefined)) {
        if (o[string] && o[string].apply) {
          return o[string].apply(o, passArgs);
        } else {
          return o[string];
        }
      } else {
        return null;
      }
    };
  },

  // Converts an object to a function.
  //
  // If the passed object is a string, it will be converted using
  // ST.stringToProc.
  toProc(object) {
    if (object.call) {
      return object;
    } else if (typeof object === 'string') {
      return ST.stringToProc(object);
    } else {
      return ST.error('Could not convert object to Proc');
    }
  },

  // Finds class with given name in this namespace or a parent namespace
  getClass(className) {
    let namespace = this;
    while (namespace) {
      if (namespace[className]) { return namespace[className]; }
      namespace = namespace._namespace;
    }
    return null;
  },

  // Creates a new class in this namespace
  makeClass(className, superClass, definition) {
    // If superclass parameter omitted, use 'Object' as superclass
    if (!definition) {
      definition = superClass;
      superClass = 'Object';
    }

    var newClass = function() {
      this._class = newClass;
      return this;
    };

    newClass._classMethods = [];

    // Inherit superclass
    if (superClass && (typeof superClass === 'string')) { superClass = this.getClass(superClass); }
    if (superClass) {
      newClass.prototype = new superClass;
      newClass._superclass = superClass;

      // Inherit class methods
      for (let methodName of Array.from(superClass._classMethods)) {
        newClass[methodName] = superClass[methodName];
        newClass._classMethods.push(methodName);
      }
    }

    // Set _name variable to name of class
    newClass._name = className;

    // Add class to namespace
    this[className] = newClass;
    newClass._namespace = this;

    // Run class definition
    return definition.call(newClass);
  },

  class(className, superClass, definition) {
    if (arguments.length > 1) {
      return this.makeClass(className, superClass, definition);
    } else {
      return this.getClass(className);
    }
  },

  module(name, definition) {
    if (!this[name]) { this[name] = {
      _namespace: this,
      _included:  [],
      getClass:   this.getClass,
      makeClass:  this.makeClass,
      class:      this.class,
      module:     this.module,
      included(definition) {
        return this._included.push(definition);
      },
      method(name, fn) {
        return this.included(function() { return this.method(name, fn); });
      },
      classMethod(name, fn) {
        return this.included(function() { return this.classMethod(name, fn); });
      }
    }; }
    if (definition) { definition.call(this[name]); }
    if (window.Spec) { Spec.extend(this[name]); }
    return this[name];
  },

  // Removes leading and trailing whitespace
  trim(s) {
    return s.replace(/(^\s+|\s+$)/g, '');
  },

  // Capitalizes the first letter of a string.
  ucFirst(s) {
    const x = String(s);
    return x.substr(0, 1).toUpperCase() + x.substr(1, x.length);
  },

  // Escapes a string for inclusion as a literal value in a regular expression.
  reEscape(s) {
    return String(s).replace(/\\|\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}|\^|\$/g, '\\$&');
  },

  // Compares two values, equivalent to comparison operator (<=>)
  compare(a, b) {
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    } else {
      return 0;
    }
  },

  // Creates an Array.sort compatible callback function from the provided
  //  conversion function.
  makeSortFn(fn, reverse) {
    fn = ST.toProc(fn);
    return function(a, b) {
      if (reverse) {
        return ST.compare(fn(b), fn(a));
      } else {
        return ST.compare(fn(a), fn(b));
      }
    };
  },

  error(message) {
    if (window.console) {
      return console.error(message);
    } else {
      return alert(message);
    }
  },

  presence(value) {
    return (value !== null) && (value !== undefined) && (value !== '');
  },

  template(template, values) {
    let s = template;
    for (let key in values) {
      const value = values[key];
      if (values.hasOwnProperty(key)) {
        s = s.replace(`:${key}`, value);
      }
    }
    return s;
  },

  // Detect touchscreen devices
  touch() { return _touch; },

  // Detect Mac OS
  mac() {
    return navigator.platform.indexOf('Mac') >= 0;
  },

  beginCommand(name) {
    if (ST._command) { throw "Tried to run more than one command at once"; }
    ST._command = {
      name,
      tally:        {},
      oneTimeTasks: {},
      log(method, time, args) {
        if (!this.tally[method]) { this.tally[method] = { method, count: 0, time: 0 }; }
        this.tally[method].count++;
        return this.tally[method].time += time;
      },
      runOneTimeTasks() {
        return (() => {
          const result = [];
          for (let key in this.oneTimeTasks) {
            const fn = this.oneTimeTasks[key];
            result.push(fn());
          }
          return result;
        })();
      },
      dump() {
        const counts = [];
        for (let id in this.tally) {
          const item = this.tally[id];
          counts.push(item);
        }
        counts.sort(ST.makeSortFn('time', true));
        if (console.table) { return console.table(counts, ['method', 'count', 'time']); }
      }
    };
    if (_logging) {
      console.groupCollapsed(`Command: ${name}`);
      console.time('execute');
    } else if (window.console) {
      console.log(`Command: ${name}`);
    }
    return ST._command;
  },

  endCommand() {
    const command = ST._command;
    command.runOneTimeTasks();
    if (_logging) {
      console.timeEnd('execute');
      command.dump();
      console.groupEnd();
    }
    if (command.reverse) { ST._history.push(command); }
    ST._command = null;
    return command;
  },

  command(name, forward, reverse=null) {
    const command = this.beginCommand(name);
    const result = forward();
    command.reverse = reverse;
    this.endCommand();
    return result;
  },

  undo() {
    let command;
    if (command = ST._history.pop()) {
      if (_logging) { console.log(`Undo command: ${command.name}`); }
      return command.reverse();
    }
  },

  once(key, fn) {
    if (ST._command) {
      return ST._command.oneTimeTasks[key] || (ST._command.oneTimeTasks[key] = fn);
    } else {
      return fn();
    }
  }
};
if (window.Spec) { Spec.extend(ST); }

if (!Array.prototype.indexOf) {
  
    Array.prototype.indexOf = function(v, n)
    {
        n = (n == null) ? 0 : n;
        const m = this.length;
        for (let i = n; i < m; i++) {
          if (this[i] == v) return i;
        }
        return -1;
    };
  
}
