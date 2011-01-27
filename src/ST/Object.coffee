ST.class 'Object', null, ->
  # Override or assign class method
  @classMethod = (name, fn) ->
    if this[name]
      this[name] = ST.overrideMethod this[name], fn
    else
      this[name] = fn
      this._classMethods.push name
  @_classMethods.push 'classMethod'
  
  # Override or assign instance method
  @classMethod 'method', (name, fn) ->
    if @$ && @$.prototype[name]
      @prototype[name] = ST.overrideMethod @$.prototype[name], fn
    else
      @prototype[name] = fn
    
    # Set function displayName for debugging
    @prototype[name].displayName = @_name + '#' + name
  
  # Create matching init (instance) and create (class) constructor methods
  @classMethod 'constructor', (name, fn) ->
    if fn
      name = ST.ucFirst(name)
    else
      fn = name
      name = ''
    
    @method 'init' + name, fn
    @classMethod 'create' + name, ->
      object = new this
      object[init].apply object, arguments
      object
  
  # Create 'destroy' destructor method
  @classMethod 'destructor', (fn) -> @method 'destroy', fn
  
  # Make a subclass of this class
  @classMethod 'subClass', (name, definition) ->
    ST.makeClass name, @$, definition
    
  # Include a module
  @classMethod 'include', (name) ->
    ST._modules[name].call this
    
  # Generates an abstract method, abstract methods must be overriden in
  # subclasses.
  @classMethod 'abstract', (name) ->
    @method name, -> ST.error 'Abstract function called'

  # Generates a "virtual" method. This method does nothing, but
  # can be overridden in subclasses.
  @classMethod 'virtual', (name, args...) ->
    expectedArgumentsLength = args.length
    @method name ->
      unless arguments.length == expectedArgumentsLength
        ST.error arguments.length + ' arguments supplied to virtual function, expected ' + expectedArgumentsLength

  # Generates a property (accessors for ivars)
  #
  # method -> 'retain': calls retain/release on assignment
  # mode -> 'readonly': Don't generate setter
  # mode -> 'writeonly': Don't generate geter
  @classMethod 'property', (method, mode) ->
    ucName = ST.ucFirst name
    unless mode == 'readonly' || @prototype['set' + ucName]
      @prototype['set' + ucName] = (newValue) ->
        oldValue = this[name]
        if method == 'retain' && newValue && newValue.retain
          newValue.retain()
        this[name] = newValue
        @_changed name, oldValue, newValue if @_changed
        if method == 'retain' && oldValue && oldValue.release
          oldValue.release()
    unless mode == 'writeonly' || @prototype['get' + ucName]
      @prototype['get' + ucName] = -> this[name]

  # Generates a "forwarder" method, that acts as a proxy for the
  # given member object.

  @classMethod 'delegate', (name, toObject, as) ->
    @method as || name, ->
      if this[toObject]
        o = this[toObject]
        o = o.call this  if x.call
        if o[name]
          x = o[name]
          x = x.call o, arguments
          x

  # Generates a "trigger" method that triggers the given event when caled.
  @classMethod 'triggerMethod', (name, args...) ->
    @method name, ->
      @trigger.apply this, args

  @classMethod 'singleton', ->
    _class = this
    @method 'instance', ->
      _class._instance = _class.create() unless _class._instance
      _class._instance
  
  # Autorelease objects
  @AutoReleasePool = []
  @AutoReleaseObject = (object) ->
    if @AutoReleasePool.length
      setTimeout ->
        for object in STObject.AutoReleasePool
          object.release() if object && object.release
        STObject.AutoReleasePool.length = 0
      , 1
      @AutoReleasePool.push object
    
  @UID = 0
    
  @BindingError = (object, trigger, target) ->
    ST.error 'Error triggering binding from ' + object +
            ':' + trigger + ' to ' + target.receiver + '.' +
            target.selector
  
  @constructor ->
    ST.error 'Object initialized twice: ' + this if @retainCount
    @retainCount = 1
    @_uid = STObject.UID++
  
  @destructor ->
    @__proto__ = Object if @__proto__
    for name of this
      delete this[name] unless name == '$' || name == '_uid'
    @_destroyed = true
    @toString = STObject.destroyedToString
  
  @method 'conformsToProtocol', (protocol) ->
    self = this
    protocol.all -> self[this]

  @method 'toString', -> '<' + @$._name + ' #' + @_uid + '>'
  
  @method '_changed', (name, oldValue, newValue) ->
    key = '_' + name + 'Changed';
    this[key] oldValue, newValue if this[key] && this[key].call
  
  @method 'set', (hash) ->
    setKey = @setKey || STObject.prototype.setKey
    if arguments.length == 2
      setKey.apply this, arguments
    else
      for key, value of hash
        setKey.call this, key, value
  
  @method 'setKey', (key, value) ->
    self = this
    a = key.split '.'
    thisKey = a.shift()
    while a.length
      if self['get' + ST.ucFirst(thisKey)]
        self = self['get' + ST.ucFirst(thisKey)].call self
      else if self[thisKey] isnt undefined
        self = self[thisKey]
      else
        self = null
      return null if self is null
      thisKey = a.shift()
    
    if self['set' + ST.ucFirst(thisKey)]
      self['set' + ST.ucFirst(thisKey)].call self, value
    else
      self[thisKey] = value
  
  @method 'get', (key) ->
    value = this
    a = key.split '.'
    while a.length
      thisKey = a.shift()
      if value['get' + ST.ucFirst(thisKey)]
        value = value['get' + ST.ucFirst(thisKey)].call value
      else if value[thisKey] isnt undefined
        value = value[thisKey]
      else
        value = null
      return null if value is null
    value
  
  @method 'methodFn', (name) ->
    self = this
    -> self[name].apply self, arguments
    
  @method 'bind', (trigger, receiver, selector) ->
    @_bindings ||= {}
    @_bindings[trigger] ||= []
    @_bindings[trigger].push {
      receiver: receiver,
      selector: selector || trigger
    }
  
  @method 'unbind', (trigger, receiver) ->
    if @_bindings && @_bindings[trigger]
      newBindings = []
      for binding in @_bindings[trigger]
        newBindings.push binding unless binding.receiver == this
      @_bindings[trigger] = newBindings
  
  @method 'unbindAll', (receiver) ->
    if @_bindings
      for trigger of @_bindings
        @unbind trigger, receiver
  
  @method 'trigger', (trigger, passArgs...) ->
    if @_bindings && @_bindings[trigger]
      for target in @_bindings[trigger]
        if target.receiver[target.selector]
          target.receiver[target.selector].apply target.receiver, passArgs
        else
          STObject.BindingError this, trigger, target
  @method 'triggerFn', (args...) ->
    self = this
    -> self.trigger.apply self, args
  
  @method 'scheduleMethod', (method, options={}) ->
    self = this
    setTimeout ->
      self[method].apply self, options.args || []
    , options.delay || 1
  
  @method 'error', (message) ->
    # Call an undefined method to trigger a javascript exception
    @causeAnException()
  
  @destroyedToString = -> '<Destroyed ' + @$._name + ' #' + @_uid + '>'