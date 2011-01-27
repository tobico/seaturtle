ST.class 'List', ->
  @include 'Enumerable'

  @constructor ->
    @_super()
    @array = []
    
  @destructor ->
    @empty()
    @_super()
    
  @method 'each', (fn) ->
    fn = ST.toProc fn
    for item in array
      break if fn.call(item, item) == 'break'
      
  @triggerMethod 'itemChanged'
    
  @method 'getAt', (index) -> @array[Number(index)]
  
  @method 'setAt', (index, value) -> @array[Number(index)] = value
  
  @method 'findByProperty', (property, value) ->
    @find (object) -> object[property] && object[property] == value
  
  @delegate 'indexOf', 'array'
  @delegate 'length', 'array', 'count'
  
  @method 'isEmpty', -> !@array.length
    
  @method 'last', -> @array.length && @array[@array.length - 1]
  
  @method 'add', (object) ->
    object.retain() if object.retain
    @array.push object
    object.bind 'changed', this, 'itemChanged' if object.bind
    @trigger 'itemAdded', object
  
  @method 'insertAt', (index, object) ->
    object.retain() if object.retain
    @array.splice index, 0, object
    object.bind 'changed', this, 'itemChanged' if object.bind
    @trigger 'itemAdded', object
  
  @method 'addAndRelease', (object) ->
    @add object
    object.release() if object.release
  
  @method 'removeAt', (index) ->
    return false if @array[index] is undefined
    object = @array.splice(index, 1)[0]
    object.unbind 'changed', this if object.unbind
    @trigger 'itemRemoved', object
    object.release() if object.release
    true
    
  @method 'removeLast', ->
    return false unless @array.length
    object = @array.pop
    object.unbind 'changed', this if object.unbind
    @trigger 'itemRemoved', object
    object.release() if object.release
    true

  @method 'remove', (object) ->
    index = @indexOf object
    index >= 0 && @removeAt index
    
  # Add all items in another array to this one
  @method 'append', (list) ->
    self = this
    @list.each (item) ->
      self.add item

  @method 'copy', ->
    newList = @$.create()
    for object in @array
      newList.add object
    newList
  
  @method 'empty', ->
    while @array.length
      @removeLast()