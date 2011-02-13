ST.class 'Spec', ->
  @EnvironmentInitialized = false
  
  @classMethod 'describe', (title, definition) ->
    @initializeEnvironment() unless @EnvironmentInitialized

    ul = $('<ul></ul>')
    $('.results').append($('<li>' + title + '</li>').append(ul))

    @testStack = [{
      title:    title
      ul:       ul
      before:   []
    }]
    
    definition()
    
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
      
    window.expect = (object) ->
      {to: (matcher) -> matcher(object) }
      
    window.beforeEach = (action) ->
      test = ST.Spec.testStack[ST.Spec.testStack.length - 1]
      test.before.push action
    
    window.describe = window.context = (title, definition) ->
      parent = ST.Spec.testStack[ST.Spec.testStack.length - 1]
    
      ul = $('<ul></ul>')
      parent.ul.append($('<li>' + title + '</li>').append(ul))
    
      ST.Spec.testStack.push {
        title:    title
        ul:       ul
        before:   []
      }
      definition()
      ST.Spec.testStack.pop()

    window.it = (title, definition) ->
      env = {}
      for test in ST.Spec.testStack
        for action in test.before
          action.call env
    
      test = ST.Spec.testStack[ST.Spec.testStack.length - 1]
      
      ST.Spec.passed = true
      try
        definition.call env
      catch e
        ST.Spec.fail 'Error: ' + e
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
          
    window.beTrue = (object) ->
      unless String(object) == 'true'
        ST.Spec.fail 'expected true, got: ' + object

    window.beFalse = (object) ->
      unless String(object) == 'false'
        ST.Spec.fail 'expected false, got: ' + object
          
    window.beAnInstanceOf = (klass) ->
      (object) ->
        unless object instanceof klass
          ST.Spec.fail 'expected an instance of ' + klass
          
    window.equal = (expected) ->
      (object) ->
        unless String(object) == String(expected)
          ST.Spec.fail 'expected to equal: ' + expected + ', actual: ' + object
    
  @classMethod 'fail', (message) ->
    @passed = false
    console.log message
    @error = message
    
  @classMethod 'uninitializeEnvironment', ->
    @EnvironmentInitialized = false
    
    delete Object.prototype.should
    delete Object.prototype.shouldReceive
    delete window.describe
    delete window.it
    delete window.beAFunction
    delete window.be
    delete window.beTrue
    delete window.beFalse
    delete window.beAnInstanceOf
    delete window.equal