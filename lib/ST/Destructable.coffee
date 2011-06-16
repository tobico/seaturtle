#require ST/Object

ST.class 'Destructable', 'Object', ->
  @initializer ->
    @super()
    ST.error 'Object initialized twice: ' + this if @_retainCount
    @_retainCount = 1

  @classMethod 'destructor', (fn) ->
    @method 'destroy', fn

  # Creates getter, setter, and property accessor
  @classMethod 'retainedProperty', (name, mode) ->
    ucName = ST.ucFirst name
    
    (@_retainedProperties ||= []).push name

    unless mode == 'write'
      @method "get#{ucName}", ->
        this["_#{name}"]

    unless mode == 'read'
      @method "set#{ST.ucFirst name}", (newValue) ->
        oldValue = this["_#{name}"]
        this["_#{name}"] = newValue
        @_changed name, oldValue, newValue
        unless oldValue is newValue
          newValue.retain() if newValue
          oldValue.release() if oldValue

    @accessor name
    
  @destructor ->
    # Unbind any loose bindings
    if @_boundTo
      for binding in @_boundTo
        binding.source.unbindOne binding.trigger, this
    
    # Release any retained properties
    c = @_class
    while c isnt ST.Destructable
      if c._retainedProperties
        for property in c._retainedProperties
          this[property] null
      c = c._superclass
    
    @__proto__ = Object if @__proto__
    for name of this
      delete this[name] unless name == '_class' || name == '_uid'
    @_destroyed = true
    @toString = -> '<Destroyed ' + @_class._name + ' #' + @_uid + '>'

  @method 'retain', ->
    @_retainCount++
  
  @method 'release', ->
    @_retainCount--
    @destroy() unless @_retainCount