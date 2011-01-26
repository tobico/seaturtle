ST.module 'STRetained', ->
  @method 'retain' -> @retainCount++
  
  @method 'release' ->
    @retainCount--
    @destroy() if retainCount == 0
  
  @method 'releaseMembers' (members...) ->
    for member in members
      if this[member]
        this[member].release() if this[member].release
        this[member] = null
  
  @method 'autorelease' -> STObject.AutoReleaseObject this