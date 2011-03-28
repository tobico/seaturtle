#require ST/Destructable

ST.class 'Controller', 'Destructable', ->
  @retainedProperty 'view'
  
  @method '_viewChanged', (oldValue, newValue) ->
    oldValue.unbindAll this if oldValue
    newValue.bind 'showing', this, 'viewShowing' if newValue
  
  @method 'viewShowing', (view) ->
    view.load()