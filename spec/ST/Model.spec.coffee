#require ST/Model
#require ST/Model/Scope

NextUUID = 0
ST.Model.GenerateUUID = -> NextUUID++

$ ->
  Spec.describe "Model", ->
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
    
    describe "#load", ->
      it "should create a new model with data", ->
        model = ST.TestModel.load {uuid: 'test'}
        model.should beAnInstanceOf(ST.TestModel)
        model.uuid().should equal('test')
      
      it "should load an array of models", ->
        ST.TestModel.load [
            {uuid: 'test-1'},
            {uuid: 'test-2'}
        ]
        ST.TestModel.find('test-1').shouldNot be(null)
        ST.TestModel.find('test-2').shouldNot be(null)