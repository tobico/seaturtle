ST.class 'Spec', ->
  @EnvironmentInitialized = false
  
  @Pad = (string, times) ->
    for i in [1..times]
      string = '&nbsp;' + string
    string
  
  @classMethod 'describe', (title, definition) ->
    @initializeEnvironment() unless @EnvironmentInitialized

    ul = $('<ul></ul>')
    switch @Format
      when 'ul'
        $('.results').append($('<li>' + title + '</li>').append(ul))
      when 'terminal'
        $('.results').append "#{title}<br>"
        ul.depth = 2

    @testStack = [{
      title:    title
      ul:       ul
      before:   []
    }]
    
    definition()
    
  @classMethod 'initializeEnvironment', ->
    @EnvironmentInitialized = true
    
    @Format = 'ul'
    @Format = 'terminal' if location.hash == '#terminal'
    
    switch @Format
      when 'ul'
        $('body').append('<ul class="results"></ul>')
      when 'terminal'
        $('body').append('<div class="results"></div>')
    
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
      switch ST.Spec.Format
        when 'ul'
          parent.ul.append($('<li>' + title + '</li>').append(ul))
        when 'terminal'
          $('.results').append(ST.Spec.Pad(title, parent.ul.depth) + "<br>")
          ul.depth = parent.ul.depth + 2
    
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

      switch ST.Spec.Format
        when 'ul'
          li = $('<li>' + title + '</li>')
          if ST.Spec.passed
            li.addClass 'passed'
          else
            li.addClass 'failed'

          test.ul.append li
        when 'terminal'
          s = title
          if ST.Spec.passed
            s = "&#x1b;[32m#{s}&#x1b;[0m<br>"
          else
            s = "&#x1b;[31m#{s}&#x1b;[0m<br>"
          $('.results').append ST.Spec.Pad(s, test.ul.depth)
      
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