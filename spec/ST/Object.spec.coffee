#= require ST/Object

Spec.describe "Object", ->
  context "with a test subclass", ->
    beforeEach ->
      ST.class "Test", "Object", -> null

    describe ".classMethod", ->
      it "should define a new class method", ->
        called = expectation 'method called'
        ST.Test.classMethod 'test', -> called.meet()
        ST.Test.test()
  
      it "should inherit to subclasses", ->
        called = expectation 'method called'
        ST.Test.classMethod 'test', -> called.meet()
        ST.class "SubTest", "Test", -> null
        ST.SubTest.test()
    
    describe ".method", ->
      it "should define a new instance method", ->
        called = expectation 'method called'
        ST.Test.method 'test', -> called.meet()
        test = ST.Test.create()
        test.test()

      it "should inherit to subclasses", ->
        called = expectation 'method called'
        ST.Test.method 'test', -> called.meet()
        ST.class "SubTest", "Test", -> null
        subTest = ST.SubTest.create()
        subTest.test()
        
      it "should override a superclass method", ->
        called = expectation 'super class method called'
        ST.Test.method 'test', -> called.meet()
        ST.class "SubTest", "Test", -> null
        subCalled = expectation 'sub class method called'
        ST.SubTest.method 'test', ->
          @super()
          subCalled.meet()
        subTest = ST.SubTest.create()
        subTest.test()
        
      it "should return existing method", ->
        test = -> false
        ST.Test.method 'test', test
        ST.Test.method('test').should equal('Test#test')

    describe ".hybridMethod", ->
      it "should define a class method", ->
        fn = -> null
        ST.Test.shouldReceive('classMethod').with('test', fn)
        ST.Test.hybridMethod 'test', fn

      it "should define an instance method", ->
        fn = -> null
        ST.Test.shouldReceive('method').with('test', fn)
        ST.Test.hybridMethod 'test', fn
    
    describe ".initializer", ->
      it "should override an init method", ->
        called = expectation 'initializer called'
        ST.Test.initializer -> called.meet()
        test = new ST.Test()
        test.init()
      
      it "should make a create method", ->
        ST.Test.create.should beAFunction
      
      it "should create a named initializer", ->
        called = expectation 'initializer called with argument'
        ST.Test.initializer 'withBacon', (bacon) ->
          @init()
          called.meet() if bacon == 'bacon'
        test = new ST.Test()
        test.initWithBacon 'bacon'
      
      it "should make a named create method", ->
        ST.Test.initializer 'withBacon', (bacon) -> null
        ST.Test.createWithBacon.should beAFunction
    
    describe ".property", ->
      beforeEach ->
        ST.Test.property 'foo'
        @test = ST.Test.create()
    
      it "should create property", ->
        @test.foo.should beAFunction
      
      it "should call getter", ->
        @test.shouldReceive('getFoo')
        @test.foo()
      
      it "should call setter", ->
        @test.shouldReceive('setFoo').with('bacon')
        @test.foo 'bacon'
      
      it "should call setter with null attribute", ->
        @test.shouldReceive('setFoo').with(null)
        @test.foo null

      describe "#getFoo", ->
        it "should get the value of assigned attribute", ->
          @test._foo = 'bacon'
          @test.getFoo().should equal('bacon')

      describe "#setFoo", ->
        it "should set the value of assigned attribute", ->
          @test.setFoo 'bacon'
          @test._foo.should equal('bacon')

        it "should call _changed method", ->
          @test._foo = 'waffles'
          @test.shouldReceive('_changed').with('foo', 'waffles', 'bacon')
          @test.setFoo 'bacon'
        
        it "should call _fooChanged method", ->
          @test._foo = 'waffles'
          @test.shouldReceive('_fooChanged').with('waffles', 'bacon')
          @test.setFoo 'bacon'
        
        it "should trigger changed event", ->
          @test._foo = 'waffles'
          @test.shouldReceive('trigger').with('changed', 'foo', 'waffles', 'bacon')
          @test.setFoo 'bacon'
    
    describe ".delegate", ->
      beforeEach ->
        ST.Test.delegate 'foo', 'parent'
        @test = ST.Test.create()
    
      it "should return public attribute of attribute", ->
        @test._parent = {foo: 'bacon'}
        @test.foo().should equal('bacon')
      
      it "should call method of attribute", ->
        @test._parent = {
          foo: -> 'bacon'
        }
        @test.foo().should equal('bacon')
      
      it "should pass through arguments", ->
        parent = []
        parent.shouldReceive('foo').with('bacon')
        @test._parent = parent
        @test.foo 'bacon'
        
      it "should return public attribute of method result", ->
        @test.parent = -> {foo: 'bacon'}
        @test.foo().should equal('bacon')
      
      it "should call method of method result", ->
        @test.parent = -> {
          foo: -> 'bacon'
        }
        @test.foo().should equal('bacon')
        
      it "should delgate under an alias", ->
        ST.Test.delegate 'foo', 'parent', 'bar'
        @test._parent = {foo: 'bacon'}
        @test.bar().should equal('bacon')
        
    describe ".singleton", ->
      beforeEach ->
        ST.Test.singleton()
    
      it "should create .instance method", ->
        ST.Test.instance.should beAFunction
      
      describe ".instance", ->
        it "should return an instance of class", ->
          test = ST.Test.instance()
          test.should beAnInstanceOf(ST.Test)
        
        it "should always return the same object", ->
          a = ST.Test.instance()
          b = ST.Test.instance()
          a.should be(b)
          
describe "#initializer", ->
  it "should create a unique UID", ->
    a = ST.Object.create()
    b = ST.Object.create()
    a._uid.shouldNot equal(b._uid)

context "with new object", ->
  beforeEach ->
    @object = ST.Object.create()

  describe "#toString", ->
    it "should return class name and UID", ->
      @object.toString().should equal("<Object ##{@object._uid}>")
    
  describe "#_changed", ->
    it "should call _(key)Changed method", ->
      @object.shouldReceive('_fooChanged').with('waffles', 'bacon')
      @object._changed 'foo', 'waffles', 'bacon'

  describe "#set", ->
    it "should call #setKey for single value", ->
      @object.shouldReceive('setKey').with('foo', 'bacon')
      @object.set 'foo', 'bacon'
    
    it "should set multiple values in hash", ->
      @object.set {
        foo: 'waffles',
        bar: 'bacon'
      }
      @object.foo.should equal('waffles')
      @object.bar.should equal('bacon')
  
  describe "#setKey", ->
    it "should set attribute", ->
      @object.setKey '_foo', 'bacon'
      @object._foo.should equal('bacon')
    
    it "should call setter", ->
      @object.shouldReceive('setFoo').with('bacon')
      @object.setKey 'foo', 'bacon'
    
    it "should set attribute of attribute", ->
      @object._parent = {_foo: 'waffles'}
      @object.setKey '_parent._foo', 'bacon'
      @object._parent._foo.should equal('bacon')
    
    it "should call setter of attribute", ->
      parent = []
      parent.shouldReceive('setFoo').with('bacon')
      @object._parent = parent
      @object.setKey '_parent.foo', 'bacon'
    
    it "should set attribute through getter", ->
      parent = {_foo: 'waffles'}
      @object.getParent = -> parent
      @object.setKey 'parent._foo', 'bacon'
      parent._foo.should equal('bacon')
    
    it "should traverse many objects to set value", ->
      planet = {_size: 100}
      forest = {getPlanet: -> planet}
      tree = {_forest: forest}
      @object.getTree = -> tree
      @object.setKey 'tree._forest.planet._size', 10000
      planet._size.should equal(10000)
  
  describe "#get", ->
    it "should call getter", ->
      @object.foo = -> 'bacon'
      @object.get('foo').should equal('bacon')
    
    it "should get attribute through getter", ->
      @object.parent = -> {foo: -> 'bacon'}
      @object.get('parent.foo').should equal('bacon')
      
  describe "#method", ->
    it "should return encapsulated method", ->
      method = @object.method('setKey')
      method '_foo', 'bacon'
      @object._foo.should equal('bacon')
      
  describe "#bind", ->
    it "should create an event binding", ->
      bound = []
      @object.bind 'foo', bound
      @object._bindings.foo.length.should equal(1)
    
    it "should set the correct receiver", ->
      bound = []
      @object.bind 'foo', bound
      @object._bindings.foo[0].receiver.should be(bound)
    
    it "should use trigger as default selector", ->
      bound = []
      @object.bind 'foo', bound
      @object._bindings.foo[0].selector.should equal('foo')
    
    it "should use specified selector", ->
      bound = []
      @object.bind 'foo', bound, 'testFoo'
      @object._bindings.foo[0].selector.should equal('testFoo')
  
  describe "#unbindOne", ->
    it "should remove an event binding", ->
      bound = []
      @object.bind 'foo', bound
      @object.unbindOne 'foo', bound
      @object._bindings.foo.length.should equal(0)
    
    it "should do nothing if no matching binding", ->
      bound = []
      @object.bind 'foo', bound
      @object.unbindOne 'bar', bound
      @object._bindings.foo.length.should equal(1)
  
  describe "#unbindAll", ->
    it "should remove any event bindings", ->
      bound = []
      @object.bind 'foo', bound
      @object.bind 'bar', bound
      @object.unbindAll bound
      @object._bindings.foo.length.should equal(0)
      @object._bindings.bar.length.should equal(0)
  
  describe "#isBound", ->
    it "should return false when no bindings", ->
      @object.isBound().should beFalse
    
    it "should return true when there is a binding", ->
      bound = []
      @object.bind 'foo', bound
      @object.isBound().should beTrue
      
  describe "#trigger", ->
    it "should trigger matching bindings", ->
      bound = []
      bound.shouldReceive('foo')
      @object.bind 'foo', bound
      @object.trigger 'foo'
    
    it "should call bindings with object as parameter", ->
      bound = []
      bound.shouldReceive('foo').with(@object)
      @object.bind 'foo', bound
      @object.trigger 'foo'
    
    it "should pass through parameters to bound function", ->
      bound = []
      bound.shouldReceive('foo').with(@object, 'bacon')
      @object.bind 'foo', bound
      @object.trigger 'foo', 'bacon'