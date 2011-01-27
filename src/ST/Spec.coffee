ST.class 'Spec', ->
  @EnvironmentInitialized = false
  
  @classMethod 'describe', (title, definition) ->
    @initializeEnvironment() unless @EnvironmentInitialized

    ul = $('<ul></ul>')
    $('.results').append($('<li>' + title + '</li>').append(ul))

    @testStack = [{
      title:    title,
      ul:       ul
    }]
    
    @case = {}
    definition.call @case
    
  @classMethod 'initializeEnvironment', ->
    @EnvironmentInitialized = true
    
    $('body').append('<ul class="results"></ul>')
    
    Object.prototype.should = (matcher) -> matcher(this)
    
    Object.prototype.shouldReceive = (name) ->
      fn = ->
      fn.with = ->
        fn
      fn.andReturn = ->
        fn
      fn
      #TODO: Something
    
    window.describe = (title, definition) ->
      parent = ST.Spec.testStack[ST.Spec.testStack.length - 1]
    
      ul = $('<ul></ul>')
      parent.ul.append($('<li>' + title + '</li>').append(ul))
    
      ST.Spec.testStack.push {
        title:    title
        ul:       ul
      }
      definition.call ST.Spec.case
      ST.Spec.testStack.pop()

    window.it = (title, definition) ->
      test = ST.Spec.testStack[ST.Spec.testStack.length - 1]
      
      ST.Spec.passed = true
      definition.call ST.Spec.case
      li = $('<li>' + title + '</li>')
      if ST.Spec.passed
        li.addClass 'passed'
      else
        li.addClass 'failed'
      
      test.ul.append li
      
    window.beAFunction = (object) ->
      unless typeof object is 'function'
        ST.Spec.fail 'expected type function, actual ' + typeof object
    
    window.be = (expected) ->
      (object) ->
        unless object is expected
          ST.Spec.fail 'expected: ' + expected + ', actual: ' + object
        
  @classMethod 'fail', (message) ->
    @passed = false
    @error = message
    
  @classMethod 'uninitializeEnvironment', ->
    @EnvironmentInitialized = false
    
    delete Object.prototype.should
    delete Object.prototype.shouldReceive
    delete window.describe
    delete window.it
    delete window.beAFunction
    delete window.be