ST.module 'Enumerable', ->
  # Returns first item in collection
  @method 'first', ->
    value = null
    @each (item) ->
      value = item
      return 'break'
    value
  
  @method 'at', (index) ->
    i = 0
    found = null
    @each (item) ->
      if i == index
        found = item
        'break'
      else
        i++
    found
  
  # Returns the index of specified item, or -1 if not found
  @method 'indexOf', (target) ->
    found = -1
    index = 0
    @each (item) ->
      if item == target
        found = index
        'break'
      else
        index++
    found
  
  # Returns true if this contains the specified item.
  @method 'has', (target) ->
    @indexOf(target) > -1

  # Returns true if callback function for at least one array member returns
  # true.
  @method 'any', (fn=null) ->
    fn = ST.toProc fn if fn
    
    found = false
    @each (item) ->
      if !fn || fn(item)
        found = true
        'break'
    found

  # Returns true if callback function for every array member returns true.
  @method 'all', (fn) ->
    fn = ST.toProc fn
    
    found = true
    @each (item) ->
      unless fn(item)
        found = false
        'break'
    found
  
  # Returns a new list with callback function applied to each item
  @method 'map', (fn=null) ->
    fn = ST.toProc fn if fn
    list = ST.List.create()
    list.retains false
    @each (item) ->
      item = fn item if fn
      list.add item
    list
  
  # Returns an array with callback function applied to each item
  @method 'mapArray', (fn=null) ->
    fn = ST.toProc fn if fn
    array = []
    @each (item) ->
      item = fn item if fn
      array.push item
    array

  # Returns sum of all items.
  @method 'sum', (initial) ->
    count = initial || 0
    @each (item) ->
      count += item
    count
  
  # Returns the first item where callback(item) evaluates true
  @method 'find', (fn) ->
    fn = ST.toProc fn
    found = null
    @each (item) ->
      if fn(item)
        found = item
        'break'
    found

  # Returns a new list with no duplicates
  @method 'unique', ->
    list = ST.List.create()
    @each (item) ->
      unless list.array.indexOf(item) >= 0
        list.add item
    list
  
  # Returns a new list containing only items where callback returns true
  @method 'collect', (fn) ->
    fn = ST.toProc fn
    list = ST.List.create()
    @each (item) ->
      list.add item if fn(item)
    list

  # Returns a new list containing only items where callback returns false
  @method 'reject', (fn) ->
    fn = ST.toProc fn
    list = ST.List.create()
    @each (item) ->
      list.add item unless fn(item)
    list

  # Returns lowest value
  @method 'min', ->
    value = null
    @each (item) ->
      value = item if item < value || value == null
    value
    
  # Returns highest value
  @method 'max', (fn) ->
    fn = fn && ST.toProc fn
    value = null
    @each (item) ->
      item = fn item if fn
      value = item if value is null || item > value
    value