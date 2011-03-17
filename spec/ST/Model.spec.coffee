#require ST/Model

NextUUID = 0
ST.Model.GenerateUUID = -> NextUUID++

$ ->
  Spec.describe "Model", ->
    beforeEach ->
      ST.class 'TestModel', 'Model', ->
        @attribute 'foo'
      @model = ST.TestModel.create()
      
    describe ".scoped", ->
      it "should return a new scope", ->
        scope = ST.TestModel.scoped()
        scope.should beAnInstanceOf(ST.Model.Scope)
    
    describe ".find", ->
      it "should find model by uuid", ->
        ST.TestModel.find(@model.uuid()).should be(@model)
    
    describe ".load", ->
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
    
    describe ".getIndex", ->
      it "should create an index", ->
        index = ST.TestModel.getIndex 'foo'
        index.should beAnInstanceOf(ST.Model.Index)
      
      it "should return existing index", ->
        index = ST.TestModel.getIndex 'foo'
        ST.TestModel.getIndex('foo').should be(index)
    
    describe ".changes", ->
      it "should return empty array", ->
        ST.TestModel.changes().should equal([])
    
    describe ".saveToServer", ->
      it "should be tested"
    
    describe "#init", ->
      it "should call #initWithData", ->
        model = new ST.TestModel()
        model.shouldReceive 'initWithData'
        model.init()
    
    describe "#initWithData", ->
      it "should generate a new UUID"
      it "should accept an existing UUID"
      it "should set attributes to their defaults"
      it "should load provided attributes"
      it "should apply bindings on one-to-many associations"
      it "should be saved in persistant storage"
    
    describe ".createWithData", ->
      it "should create using correct model type if specified"
      it "should not create if specified model type is not found"
      it "should update an existing object with same ID"
      it "should create a new object"
    
    describe "#setUuid", ->
      it "should add object to global index"
      it "should add object to model index"
    
    describe "#matches", ->
      it "should evaluate conditions"
    
    describe "#getManyList", ->
      it "needs to be tested"
    
    describe "#_changed", ->
      it "should store change in change list"
    
    describe "#serialize", ->
      it "should return a text representation of object"
    
    describe "#persist", ->
      it "should save object in persistant storage"
    
    describe "#deindex", ->
      it "should remove object from global index"
      it "should remove object from model index"
      it "should remove object from attribute indexes"
    
    describe "#destroy", ->
      it "should deindex object"
      it "should store destruction in change list"
    
    describe "#forget", ->
      it "should unload object from client"
    
    describe ".attribute", ->
      it "should register default value for attribute"
      it "should create a getter method"
      it "should create a setter method"
      it "should create an accessor method"
      
      describe "#set(Attribute)", ->
        it "should set new value"
        it "should update an attribute index"
        it "should trigger _changed event"
      
      describe "#get(Attribute)", ->
        it "should return attribute value"
    
    describe ".belongsTo", ->
      it "should create a Uuid attribute"
      it "should create a getter method"
      it "should create a setter method"
      it "should create an accessor method"
      it "should apply bindings"
    
    describe ".hasMany", ->
      context "with a foreign key", ->
        it "should create a getter method for scope"
        it "should store details of binding"
      
      context "without a foreign key", ->
        it "should create a uuids getter method"
        it "should create a uuids setter method"
        it "should create a uuids accessor method"
        it "should create a getter method"
        it "should create an add method"
    
    describe ".setStorage", ->
      it "should set the persistant store"
      it "should save an existing model to persistant storage"
      it "should load a model from persistant storage"