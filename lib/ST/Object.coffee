#require ST

ST.class 'Object', null, ->
  # Used to override an existing method of an STObject. Allows the overriding
  # method to call the overridden method using `@super()`, no matter how
  # many methods are chained together.
  @OverrideMethod = (oldMethod, newMethod) ->
    ->
      oldSuper = @super || null
      @super = oldMethod
      result = newMethod.apply this, arguments
      @super = oldSuper
      result
  
  @MethodToString = -> @displayName
  
  # Override or assign class method
  @classMethod = (name, fn) ->
    if this[name]
      this[name] = ST.Object.OverrideMethod this[name], fn
    else
      this[name] = fn
      this._classMethods.push name
  @_classMethods.push 'classMethod'
  
  # Override or assign instance method
  @classMethod 'method', (name, fn) ->
    if fn?
      if @_superclass && @_superclass.prototype[name]
        @prototype[name] = ST.Object.OverrideMethod @_superclass.prototype[name], fn
      else if window.console
        @prototype[name] = ->
          start = Number(new Date)
          result = fn.apply this, arguments
          end = Number(new Date)
          ST._command.log @[name], (end - start), arguments if ST._command
          result
      else
        @prototype[name] = fn

      # Set function displayName for debugging
      @prototype[name].displayName = @_name + '#' + name
      @prototype[name].toString = ST.Object.MethodToString
    else
      @prototype[name]
  
  # Creates a method defined at both class and instance level
  @classMethod 'hybridMethod', (name, fn) ->
    @classMethod name, fn
    @method name, fn
  
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
  @classMethod 'include', (module) ->
    if module._included
      for definition in module._included
        definition.call this
  
  @classMethod 'accessor', (name) ->
    ucName = ST.ucFirst name
    @method name, (value) ->
      if value isnt undefined
        this["set#{ucName}"](value)
      else
        this["get#{ucName}"]()
  
  # Creates getter, setter, and property accessor
  @classMethod 'property', (name, mode) ->
    ucName = ST.ucFirst name
    
    unless mode == 'write'
      @method "get#{ucName}", ->
        this["_#{name}"]
    
    unless mode == 'read'
      @method "set#{ST.ucFirst name}", (newValue) ->
        oldValue = this["_#{name}"]
        this["_#{name}"] = newValue
        @_changed name, oldValue, newValue
        @trigger 'changed', name, oldValue, newValue
    
    @accessor name
  
  # Generates a "forwarder" method, that acts as a proxy for the
  # given member object.
  @classMethod 'classDelegate', (name, toObject, as) ->
    @classMethod (as || name), ->
      through = this[toObject] || this["_#{toObject}"]
      through = through.call this if through && through.call
      if through
        attr = through[name]
        attr = attr.apply through, arguments if attr && attr.call
        attr

  # Generates a "forwarder" method, that acts as a proxy for the
  # given member object.
  @classMethod 'delegate', (name, toObject, as) ->
    @method (as || name), ->
      through = this[toObject] || this["_#{toObject}"]
      through = through.call this if through && through.call
      if through
        attr = through[name]
        attr = attr.apply through, arguments if attr && attr.call
        attr
      
  # Creates a "singleton pattern" class, with a method ".instance" which
  # always returns the same instance of class.
  @classMethod 'singleton', ->
    @classMethod 'instance', ->
      @_instance ||= @create()
    
  @UID = 0
  
  @initializer ->
    @_uid = ST.Object.UID++

  @method 'toString', -> '<' + @_class._name + ' #' + @_uid + '>'
  
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
        ST.Object.method('setKey').call that, there, value
    else
      if this["set#{ucHere}"]
        this["set#{ucHere}"] value
      else
        this[here] = value
  
  @method 'get', (key) ->
    a = key.split '.'
    here = a.shift()
    there = a.join '.'
    
    that = this[here] && this[here]()
    
    if there && there.length
      if that == null
        null
      else if that.get
        that.get there
      else
        ST.Object.method('get').call that, there  
    else
      that
  
  # Produces a function that calls the named method on this object
  @method 'method', (name) ->
    self = this
    -> self[name].apply self, arguments
    
  @hybridMethod 'bind', (trigger, receiver, selector) ->
    @_bindings ||= {}
    @_bindings[trigger] ||= []
    if typeof receiver == 'function' && receiver[selector || trigger] is undefined
      @_bindings[trigger].push { fn: receiver }
    else
      receiver._boundTo ||= []
      receiver._boundTo.push {source: this, trigger: trigger}
      @_bindings[trigger].push {
        receiver: receiver,
        selector: selector || trigger
      }
  
  @hybridMethod 'unbindOne', (trigger, receiver) ->
    if @_bindings && @_bindings[trigger]
      bindings = @_bindings[trigger]
      i = 0
      while bindings[i]
        if bindings[i].receiver == receiver
          bindings[i].destroyed = true
          bindings.splice i, 1
        i++
  
  @hybridMethod 'unbindAll', (receiver) ->
    if @_bindings
      for trigger of @_bindings
        @unbindOne trigger, receiver
  
  @hybridMethod 'unbind', (trigger, receiver) ->
    if receiver?
      @unbindOne trigger, receiver
    else
      @unbindAll trigger
  
  @hybridMethod 'isBound', ->
    if @_bindings
      for trigger of @_bindings
        if @_bindings.hasOwnProperty trigger
          return true
    false
  
  @hybridMethod 'trigger', (trigger, passArgs...) ->
    if @_bindings && @_bindings[trigger]
      # Use #slice to make a copy of bindings before we start calling them,
      # prevents issues when a bound callback alters bindings during its execution
      for binding in @_bindings[trigger].slice(0)
        unless binding.destroyed
          if binding.fn
            binding.fn this, passArgs...
          else if binding.receiver[binding.selector]
            binding.receiver[binding.selector] this, passArgs...
          else
            ST.error "Error triggering binding from #{this}: #{trigger} to #{binding.receiver}.#{binding.selector}"
  
  @method 'error', (message) ->
    # Call an undefined method to trigger a javascript exception
    @causeAnException()

Spec.extend ST.Object if window.Spec