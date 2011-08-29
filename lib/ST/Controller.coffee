#= require ST/Destructable

ST.class 'Controller', 'Destructable', ->
  @retainedProperty 'view'
  
  @method '_viewChanged', (oldValue, newValue) ->
    oldValue.unbindAll this if oldValue
    newValue.bind 'loaded', this, 'viewLoaded' if newValue
    newValue.bind 'unloaded', this, 'viewUnloaded' if newValue
  
  @method 'viewLoaded', ->
  @method 'viewUnloaded', ->