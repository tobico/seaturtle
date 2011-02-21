#require ST/Destructable

ST.class 'ViewController', 'Destructable' ->
  @initializer ->
    @super()
    @view = null
  
  @destructor ->
    @releaseMembers 'view'
    
  @property 'view', 'retain'
  
  @method 'setView', (newView) ->
    return if newView == @view
    
    if @view
      @view.release()
      @view.unbindAll this
      
    @view = newView
    
    if @view
      @view.retain()
      @view.bind 'showing', this, 'viewShowing'
  
  @method 'viewShowing', (view) ->
    view.load() if @view && @view == view && !view.loaded