window.ST = {
  # Converts a string to a function returns the named attribute of it's first
  # parameter, or (this) object.
  # 
  # If given attribute is a function, it will be called with any additional
  # arguments provided to stringToProc, and the result returned.
  stringToProc: (string, passArgs = []) ->
    (o) ->
      if this && this[string] isnt undefined
        if this[string] && this[string].apply
          this[string].apply this, passArgs
        else
          this[string]
      else if o && o[string] isnt undefined
        if o[string] && o[string].apply
          o[string].apply o, passArgs
        else
          o[string]
      else
        null

  # Converts an object to a function.
  # 
  # If the passed object is a string, it will be converted using 
  # ST.stringToProc.
  toProc: (object) ->
    if object.call
      object
    else if typeof object is 'string'
      ST.stringToProc object
    else
      ST.error 'Could not convert object to Proc'

  # Used to override an existing method of an STObject. Allows the overriding
  # method to call the overridden method using `this._super`, no matter how
  # many methods are chained together.
  #
  # If the method does not return a value, the STObject the method was called
  # will be returned, to allow chaining of methods
  overrideMethod: (oldMethod, newMethod) ->
    ->
      oldSuper = @super || null;
      @super = oldMethod
      result = newMethod.apply this, arguments
      @super = oldSuper
      result

  # Creates a new class. This would normally be called as a result of calling
  # STObject.subClass().
  class: (className, superClass, definition) ->
    unless definition
      definition = superClass
      superClass = 'Object'
    
    newClass = -> @$ = newClass
    
    newClass._classMethods = []
    
    # Inherit superclass
    if superClass && superClass = ST[superClass]
      newClass.prototype = new superClass
      newClass.$ = superClass
      
      # Inherit class methods
      for methodName in superClass._classMethods
        newClass[methodName] = superClass[methodName]
        newClass._classMethods.push methodName
    
    # Set _name variable to name of class
    newClass._name = className
      
    # Add class to global object
    ST[className] = newClass
    
    definition.call newClass
    
  module: (name, definition) ->
    ST._modules ||= {}
    ST._modules[name] = definition

  # Capitalizes the first letter of a string.
  ucFirst: (s) ->
    x = String(s);
    x.substr(0, 1).toUpperCase() + x.substr(1, x.length)

  # Escapes a string for inclusion as a literal value in a regular expression.
  reEscape: (s) ->
    String(s).replace /\\|\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}|\^|\$/g, '\\$&'

  # Compares two values, equivalent to comparison operator (<=>)
  compare: (a, b) ->
    if a > b
      1
    else if a < b
      -1
    else
      0

  # Creates an Array.sort compatible callback function from the provided
  #  conversion function.
  makeSortFn: (fn, reverse) ->
    fn = ST.P fn
    (a, b) ->
      if reverse
        ST.compare fn(b), fn(a)
      else
        ST.compare fn(a), fn(b)

  error: (message) ->
    if window.console
      console.error message
    else
      alert message
}

unless Array.prototype.indexOf
  `
    Array.prototype.indexOf = function(v, n)
    {
        n = (n == null) ? 0 : n;
        var m = this.length;
        for (var i = n; i < m; i++) {
          if (this[i] == v) return i;
        }
        return -1;
    };
  `