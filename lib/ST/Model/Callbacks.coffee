#require ST/Object

ST.module 'Model', ->
  @module 'Callbacks', ->
    @classMethod 'callback', (name) ->
      ucName = ST.ucFirst name
      @classMethod "before#{ucName}", (method) ->
        @["_before#{ucName}"] ||= []
        @["_before#{ucName}"].push method
      @classMethod "after#{ucName}", (method) ->
        @["_after#{ucName}"] ||= []
        @["_after#{ucName}"].push method
    
    @method 'callBefore', (name) ->
      @callCallbacks @_class["_before#{ST.ucFirst name}"]
    
    @method 'callAfter', (name) ->
      @callCallbacks @_class["_after#{ST.ucFirst name}"]
    
    @method 'callCallbacks', (callbacks) ->
      if callbacks && callbacks.length
        for callback in callbacks
          if callback.call
            callback.call this
          else
            this[callback]()