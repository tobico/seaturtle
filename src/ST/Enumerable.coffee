ST.module 'Enumerable', ->

  # Runs the specified callback function for each item, in an
  # asynchronous manner.
  #
  # Options:
  #   done:           callback to call when all complete
  #   steps:          total number of synchronous steps to take       
  #   or  iteration:  number of items to process in each iteration
  @method 'eachAsync', (fn, options={}) ->
    self  = this
    fn    = ST.P fn
  
    iteration = 1
    iteration = Math.round(@length / options.steps) if options.steps
    iteration = options.iteration if options.iteration
    iteration = 1 if iteration < 1
  
    i = 0
    _loop = iteration - 1
    step = ->
      fn.call options.object || null, self[i], i
      i++
      if i < self.length
        if _loop > 0
          _loop--
          step()
        else
          _loop = iteration - 1
          setTimeout step, 1
      else if options.done
        setTimeout options.done, 1
    setTimeout step, 1

  # Returns true if this contains the specified item.
  @method 'has', (target) ->
    found = false
    @each (item) ->
      if item == target
        found = true
        'break'
    found

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
  @method 'max', ->
    value = null
    @each (item) ->
      value = item if item > value || value == null
    value