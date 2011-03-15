#require ST/Model
#require ST/Model/Scope

NextUUID = 0
ST.Model.GenerateUUID = -> NextUUID++

$ ->
  ST.Spec.describe "Model", ->
    beforeEach ->
      ST.class 'TestModel', 'Model', -> null
      @model = ST.TestModel.create()
      
    describe "#scoped", ->
      it "should return a new scope", ->
        scope = ST.TestModel.scoped()
        scope.should beAnInstanceOf(ST.Model.Scope)
    
    describe "#find", ->
      it "should find model by uuid", ->
        ST.TestModel.find(@model.uuid()).should be(@model)