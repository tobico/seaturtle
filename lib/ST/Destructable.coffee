ST.class 'Destructable', 'Object', ->
  @initializer ->
    @super()
    ST.error 'Object initialized twice: ' + this if @_retainCount
    @_retainCount = 1

  @classMethod 'destructor', (fn) ->
    @method 'destroy', fn
    
  @destructor ->
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
  
  @method 'releaseProperties', (properties...) ->
    for property in properties
      name = "_#{property}"
      if this[name]
        this[name].release() if this[name].release
        this[name] = null