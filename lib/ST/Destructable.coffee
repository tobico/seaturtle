ST.class 'Destructable', 'Object', ->
  @initializer ->
    @super()
    ST.error 'Object initialized twice: ' + this if @retainCount
    @retainCount = 1

  @classMethod 'destructor', (fn) ->
    @method 'destroy', fn
    
  @destructor ->
    @__proto__ = Object if @__proto__
    for name of this
      delete this[name] unless name == '$' || name == '_uid'
    @_destroyed = true
    @toString = ST.Destructable.destroyedToString

  @method 'retain', ->
    @retainCount++
  
  @method 'release', ->
    @retainCount--
    @destroy() if retainCount == 0
  
  @method 'releaseMembers', (members...) ->
    for member in members
      if this[member]
        this[member].release() if this[member].release
        this[member] = null
  
  @method 'autorelease', -> STObject.AutoReleaseObject this
  
  @destroyedToString = -> '<Destroyed ' + @$._name + ' #' + @_uid + '>'