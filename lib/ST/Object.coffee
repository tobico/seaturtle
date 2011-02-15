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
    if fn?
      if @$ && @$.prototype[name]
        @prototype[name] = ST.overrideMethod @$.prototype[name], fn
      else
        @prototype[name] = fn
    else
      @prototype[name]
    
    # Set function displayName for debugging
    @prototype[name].displayName = @_name + '#' + name
  
  # Create matching init (instance) and create (class) constructor methods
  @classMethod 'initializer', (name, fn) ->
    if fn
      name = ST.ucFirst(name)
    else
      fn = name
      name = ''
    
    @method 'init' + name, fn
    @classMethod 'create' + name, ->
      object = new this()
      object['init' + name].apply object, arguments
      object
    
  # Include a module
  @classMethod 'include', (name) ->
    ST._modules[name].call this
  
  # Creates getter, setter, and property accessor
  @classMethod 'property', (name) ->
    ucName = ST.ucFirst name
    
    @method "get#{ucName}", ->
      this["_#{name}"]
      
    @method "set#{ST.ucFirst name}", (newValue) ->
      oldValue = this["_#{name}"]
      this["_#{name}"] = newValue
      @_changed name, oldValue, newValue if @_changed
    
    @method name, (value) ->
      if value?
        this["set#{ucName}"](value)
      else
        this["get#{ucName}"]()
  
  # Generates a "forwarder" method, that acts as a proxy for the
  # given member object.
  @classMethod 'delegate', (name, toObject, as) ->
    @method (as || name), ->
      through = this[toObject] || this["_#{toObject}"]
      through = through.call this if through && through.call
      if through
        attr = through[name]
        attr = attr.call through if attr && attr.call
        attr
      
  # Creates a "singleton pattern" class, with a method ".instance" which
  # always returns the same instance of class.
  @classMethod 'singleton', ->
    @classMethod 'instance', ->
      @_instance ||= @create()
    
  @UID = 0
    
  @BindingError = (object, trigger, target) ->
    ST.error 'Error triggering binding from ' + object +
            ':' + trigger + ' to ' + target.receiver + '.' +
            target.selector
  
  @initializer ->
    @_uid = ST.Object.UID++

  @method 'toString', -> '<' + @$._name + ' #' + @_uid + '>'
  
  @method '_changed', (name, oldValue, newValue) ->
    key = '_' + name + 'Changed';
    this[key] oldValue, newValue if this[key] && this[key].call
  
  @method 'set', (keys, value=null) ->
    if value
      @setKey keys, value
    else
      for key, value of keys
        @setKey key, value
  
  @method 'setKey', (key, value) ->
    a = key.split '.'
    here = a.shift()
    there = a.join '.'
    ucHere = ST.ucFirst here
    
    if there && there.length
      that = if this["get#{ucHere}"]
        this["get#{ucHere}"]()
      else
        this[here]
      
      if that == null
        null
      else if that.setKey
        that.setKey there, value
      else
        ST.Object.prototype.setKey.call that, there, value
    else
      if this["set#{ucHere}"]
        this["set#{ucHere}"](value)
      else
        this[here] = value
  
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
          ST.Object.BindingError this, trigger, target
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