ST.class 'List', ->
  @include 'Enumerable'

  @initializer ->
    @super()
    @array = []
    
  @method 'each', (fn) ->
    fn = ST.toProc fn
    for item in @array
      break if fn.call(item, item) == 'break'
      
  @triggerMethod 'itemChanged'
    
  @method 'getAt', (index) ->
    if index > 0 && index < @array.length
      @array[Number(index)]
    else
      null
    
  @delegate 'indexOf', 'array'
  @delegate 'length', 'array', 'count'
  
  @method 'isEmpty', -> !@array.length
    
  @method 'last', ->
    if @array.length
      @array[@array.length - 1]
    else
      null
  
  @method 'add', (object) ->
    @insertAt @array.length, object
  
  @method 'insertAt', (index, object) ->
    object.retain() if object.retain
    @array.splice index, 0, object
    object.bind 'changed', this, 'itemChanged' if object.bind
    @trigger 'itemAdded', object
  
  @method 'addAndRelease', (object) ->
    @add object
    object.release() if object.release
  
  @method 'removeAt', (index) ->
    return false unless @array.length > index
    object = @array.splice(index, 1)[0]
    object.unbind 'changed', this if object.unbind
    @trigger 'itemRemoved', object
    object.release() if object.release
    true
    
  @method 'removeLast', ->
    if @array.length > 0
      @removeAt @array.length - 1
    else
      false
  
  @method 'remove', (object) ->
    index = @array.indexOf object
    index >= 0 && @removeAt index
    
  # Add all items in another list to this one
  @method 'append', (list) ->
    self = this
    list.each (item) ->
      self.add item

  @method 'copy', ->
    newList = @$.create()
    for object in @array
      newList.add object
    newList
  
  @method 'empty', ->
    while @array.length
      @removeLast()