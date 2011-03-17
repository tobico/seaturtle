#require ST/Model/Scope

$ ->
  Spec.describe "Model/Scope", ->
    beforeEach ->
      @scope = ST.Model.scoped()
      
    describe "#initWithModel", ->
      beforeEach ->
        @scope = new ST.Model.Scope()
        @scope.initWithModel ST.Model

      it "should set @_model", ->
        @scope._model.should be(ST.Model)
        
      it "should set defaults", ->
        @scope._conditions.should equal([])
        expect(@scope._order).to be(null)
    
    describe "#initWithScope", ->
      it "should copy scope model"
      it "should copy scope conditions"
      it "should copy scope order"
    
    describe "#fork", ->
      it "should copy scope"
      it "should run block on new scope"
    
    describe "#where", ->
      it "should add conditions to fork of scope with no conditions"
      it "should combine conditions on fork of scope with conditions"
    
    describe "#order", ->
      it "should set order on fork of scope"
    
    describe "#enableBindings", ->
      it "should bind scope to a relevant attribute index"
    
    describe "#each", ->
      it "should iterate over items matched by scope"
      it "should iterate over items in order"
    
    describe "#count", ->
      it "should count number of items matched by scope"
    
    describe "#destroyAll", ->
      it "should destory all items matched by scope"
    
    describe "#build", ->
      it "should create a new object using scope conditions as base data"
    
    describe "#indexItemAdded", ->
      it "should trigger event if item matches scope"
      it "should do nothing if item doesn't match scope"
    
    describe "#indexItemRemoved", ->
      it "should trigger event if item matches scope"
      it "should do nothing if item doesn't match scope"
    
    describe "#indexItemChanged", ->
      it "should trigger event if item matches scope"
      it "should do nothing if item doesn't match scope"