#require ST/Object

$ ->
  ST.Spec.describe "Destructable", ->
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
    
    context "with a new destructable", ->
      beforeEach ->
        @test = ST.Destructable.create()
      
      describe "#destroy", ->
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
      
      describe "#releaseProperties", ->
        it "should set attributes to null", ->
          @test._foo = 'bacon'
          @test.releaseProperties 'foo'
          expect(@test._foo).to be(null)
        
        it "should call release on objects that have it", ->
          object = {}
          object.shouldReceive 'release'
          @test._foo = object
          @test.releaseProperties 'foo'