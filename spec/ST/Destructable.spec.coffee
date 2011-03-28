#require ST/Object

$ ->
  Spec.describe "Destructable", ->
    describe "#init", ->
      it "should set _retainCount to 1", ->
        test = new ST.Destructable()
        test.init()
        test._retainCount.should equal(1)
  
    describe ".destructor", ->
      it "should create #destroy", ->
        called = expectation 'to call custom destructor'
        ST.class 'Test', 'Destructable', ->
          @destructor ->
            called.meet()
            @super()
        test = ST.Test.create()
        test.destroy()
        
    describe ".retainedProperty", ->
      beforeEach ->
        ST.class 'Test', 'Destructable', ->
          @retainedProperty 'foo'
        @test = ST.Test.create()

      it "should create property", ->
        @test.foo.should beAFunction
      
      it "should add property to class list of retained properties", ->
        ST.Test._retainedProperties.should equal(['foo'])

      describe "#getFoo", ->
        it "should get the value of assigned attribute", ->
          a = ST.Test.create()
          @test._foo = a
          @test.getFoo().should be(a)

      describe "#setFoo", ->
        it "should set the value of assigned attribute", ->
          a = ST.Test.create()
          @test.foo a
          @test._foo.should be(a)
          
        it "should release old value", ->
          a = ST.Test.create()
          @test._foo = a
          a.shouldReceive 'release'
          @test.foo null
        
        it "should retain new value", ->
          a = ST.Test.create()
          a.shouldReceive 'retain'
          @test.foo a
        
        it "should not retain or release when setting to same value", ->
          a = ST.Test.create()
          @test._foo = a
          a.shouldNotReceive 'retain'
          a.shouldNotReceive 'release'
          @test.foo a
        
        it "should call _changed method", ->
          a = ST.Test.create()
          b = ST.Test.create()
          @test._foo = a
          @test.shouldReceive('_changed').with('foo', a, b)
          @test.foo b
    
    context "with a new destructable", ->
      beforeEach ->
        @test = ST.Destructable.create()
      
      describe "#destroy", ->
        it "should release retained properties of class", ->
          ST.class 'Test', 'Destructable', ->
            @retainedProperty 'foo'
          test = ST.Test.create()
          child = ST.Destructable.create()
          test.foo child
          child.shouldReceive 'release'
          test.destroy()
          
        it "should release retained properties of superclass", ->
          ST.class 'Test', 'Destructable', ->
            @retainedProperty 'foo'
          ST.class 'SubTest', 'Test', ->
            @retainedProperty 'bar'
          test = ST.SubTest.create()
          child = ST.Destructable.create()
          test.foo child
          child.shouldReceive 'release'
          test.destroy()
          delete ST.SubTest
      
        it "should set __proto__ to Object", ->
          @test.destroy()
          @test.__proto__.should be(Object)
        
        it "should delete any attrs or methods except _class and _uid", ->
          uid = @test._uid
          @test._foo = 'bacon'
          @test.bar = -> 'waffles'
          @test.destroy()
          expect(@test._foo).to be(undefined)
          expect(@test.bar).to be(undefined)
          @test._uid.should equal(uid)
          @test._class.should be(ST.Destructable)
        
        it "should set _destroyed", ->
          @test.destroy()
          @test._destroyed.should beTrue
        
        it "should replace toString", ->
          uid = @test._uid
          @test.destroy()
          String(@test).should equal("<Destroyed Destructable ##{uid}>")
      
      describe "#retain", ->
        it "should increase _retainCount", ->
          @test.retain()
          @test._retainCount.should equal(2)
      
      describe "#release", ->
        it "should decrease _retainCount", ->
          @test.retain()
          @test.release()
          @test._retainCount.should equal(1)
        
        it "should call destroy if _retainCount is 0", ->
          @test.shouldReceive 'destroy'
          @test.release()
        
        it "should not call destroy if _retainCount is > 0", ->
          @test.retain()
          @test.shouldNotReceive 'destroy'
          @test.release()