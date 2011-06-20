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
  
  # Finds class with given name in this namespace or a parent namespace
  getClass: (className) ->
    namespace = this
    while namespace
      return namespace[className] if namespace[className]
      namespace = namespace._namespace
    null
  
  # Creates a new class in this namespace
  makeClass: (className, superClass, definition) ->
    # If superclass parameter omitted, use 'Object' as superclass
    unless definition
      definition = superClass
      superClass = 'Object'
    
    newClass = ->
      @_class = newClass
      this
    
    newClass._classMethods = []
    
    # Inherit superclass
    superClass = @getClass superClass if superClass && (typeof superClass == 'string')
    if superClass
      newClass.prototype = new superClass
      newClass._superclass = superClass
      
      # Inherit class methods
      for methodName in superClass._classMethods
        newClass[methodName] = superClass[methodName]
        newClass._classMethods.push methodName
    
    # Set _name variable to name of class
    newClass._name = className
      
    # Add class to namespace
    this[className] = newClass
    newClass._namespace = this
    
    # Run class definition
    definition.call newClass
  
  class: (className, superClass, definition) ->
    if arguments.length > 1
      @makeClass className, superClass, definition
    else
      @getClass className
  
  module: (name, definition) ->
    @[name] ||= {
      _namespace: this
      _included:  []
      getClass:   @getClass
      makeClass:  @makeClass
      class:      @class
      module:     @module
      included:     (definition) ->
        @_included.push definition
      method:       (name, fn) ->
        @included -> @method name, fn
      classMethod:  (name, fn) ->
        @included -> @classMethod name, fn
    }
    definition.call @[name] if definition
    Spec.extend @[name] if window.Spec
    @[name]
  
  # Removes leading and trailing whitespace
  trim: (s) ->
    s.replace /(^\s+|\s+$)/g, ''
  
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
    fn = ST.toProc fn
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
  
  template: (template, values) ->
    s = template
    for key, value of values
      if values.hasOwnProperty key
        s = s.replace ":#{key}", value
    s
  
  # Detect touchscreen devices
  touch: ->
    navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/) isnt null
  
  initializeCancelStack: ->
    @_cancelStack ||= []
    $ ->
      $('html').keydown (e) ->
        if e.which == 27 && ST._cancelStack.length
          ST._cancelStack[ST._cancelStack.length - 1]()
          e.stopPropagation()
          e.preventDefault()
  
  pushCancelFunction: (fn) ->
    @initializeCancelStack()
    @_cancelStack.push fn
  
  popCancelFunction: ->
    @initializeCancelStack()
    @_cancelStack.pop()
  
  beginCommand: (name) ->    
    throw "Tried to run more than one command at once" if ST._command
    ST._command = {
      tally: {}
      oneTimeTasks: {}
      log: (method, time, args) ->
        @tally[method] ||= { method: method, count: 0, time: 0 }
        @tally[method].count++
        @tally[method].time += time
      runOneTimeTasks: ->
        for key, fn of @oneTimeTasks
          fn()
      dump: ->
        counts = []
        for id, item of @tally
          counts.push item
        counts.sort ST.makeSortFn('time', true)
        console.table counts, ['method', 'count', 'time'] if console.table
    }
    if window.console && console.groupCollapsed
      console.groupCollapsed "Command: #{name}"
      console.time 'execute'
  
  endCommand: ->
    ST._command.runOneTimeTasks()
    if window.console
      console.timeEnd 'execute'
      ST._command.dump()
      console.groupEnd()
    ST._command = null
  
  command: (name, forward, reverse=null) ->
    @beginCommand name
    forward()
    @endCommand()
  
  once: (key, fn) ->
    if ST._command
      ST._command.oneTimeTasks[key] ||= fn
    else
      fn()
}
Spec.extend ST if window.Spec

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