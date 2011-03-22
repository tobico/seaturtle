#require ST/Model

NextUUID = 0
ST.Model.GenerateUUID = -> NextUUID++

$ ->
  Spec.describe "Model", ->
    beforeEach ->
      ST.class 'TestModel', 'Model', ->
        @string 'foo', 'bacon'
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
      it "should return an array", ->
        ST.TestModel.changes().should beAnInstanceOf(Array)
    
    describe ".saveToServer", ->
      it "should be tested"
    
    describe "#init", ->
      it "should call #initWithData", ->
        model = new ST.TestModel()
        model.shouldReceive 'initWithData'
        model.init()
    
    describe "#initWithData", ->
      beforeEach ->
        @model = new ST.TestModel()
      
      it "should generate a new UUID", ->
        ST.Model.GenerateUUID = -> 'foo'
        @model.initWithData {}
        @model.uuid().should equal('foo')
        
      it "should accept an existing UUID", ->
        @model.initWithData {uuid: 'bar'}
        @model.uuid().should equal('bar')
        
      it "should set attributes to their defaults", ->
        @model.initWithData {}
        @model.foo().should equal('bacon')
        
      it "should load provided attributes", ->
        @model.initWithData {foo: 'waffles'}
        @model.foo().should equal('waffles')
      
      it "should apply bindings on one-to-many associations"
    
    describe ".createWithData", ->
      it "should create using correct model type if specified", ->
        model = ST.Model.createWithData {model: 'TestModel'}
        model.should beAnInstanceOf(ST.TestModel)
      
      it "should not create if specified model type is not found", ->
        model = ST.Model.createWithData {model: 'Bacon'}
        expect(model).to be(null)
      
      it "should update an existing object with same ID", ->
        model = ST.TestModel.createWithData {uuid: 'recreate', foo: 'bacon'}
        ST.TestModel.createWithData {uuid: 'recreate', foo: 'waffles'}
        model.foo().should equal('waffles')
      
      it "should create a new object", ->
        model = ST.TestModel.createWithData {foo: 'bacon'}
        model.should beAnInstanceOf(ST.TestModel)
    
    describe "#setUuid", ->
      it "should add object to global index", ->
        model = new ST.TestModel()
        model.uuid 'test'
        ST.Model._byUuid['test'].should be(model)
      
      it "should add object to model index", ->
        model = new ST.TestModel()
        model.uuid 'test'
        ST.TestModel._byUuid['test'].should be(model)
      
      it "should do nothing if model already has ID", ->
        model = new ST.TestModel()
        model._uuid = "test"
        model.uuid 'test'
        ST.Model._byUuid['test'].shouldNot be(model)
    
    describe "#matches", ->
      it "should match when meets conditions", ->
        @model.matches([ST.TestModel.foo.equals('bacon')]).should beTrue

      it "should not match when fails condition", ->
        @model.matches([ST.TestModel.foo.equals('waffles')]).should beFalse
    
    describe "#getManyList", ->
      it "needs to be tested"
    
    describe "#_changed", ->
      it "should store change in change list", ->
        ST.Model._changes = []
        @model.foo 'waffles'
        ST.Model._changes.length.should equal(1)
        change = ST.Model._changes[0]
        change.uuid.shouldNot be(null)
        change.model.should equal('TestModel')
        change.type.should equal('update')
        change.objectUuid.should equal(@model.uuid())
        change.attribute.should equal('foo')
        change.oldValue.should equal('bacon')
        change.newValue.should equal('waffles')
      
      it "should update persistant storage", ->
        @model.shouldReceive('persist')
        @model.foo 'waffles'
    
    describe "#serialize", ->
      it "should return a text representation of object", ->
        @model._uuid = 'test'
        @model.serialize().should equal('{"model":"TestModel","uuid":"test","foo":"bacon"}')
    
    describe "#persist", ->
      it "should save object in persistant storage", ->
        ST.Model.Storage = {}
        @model._uuid = 'test'
        ST.Model.Storage.shouldReceive('set').with('test', @model.serialize())
        @model.persist()
        delete ST.Model.Storage
    
    describe "#forget", ->
      it "should remove object from global index", ->
        uuid = @model.uuid()
        @model.forget()
        expect(ST.Model._byUuid[uuid]).to be(undefined)
      
      it "should remove object from model index", ->
        uuid = @model.uuid()
        @model.forget()
        expect(ST.TestModel._byUuid[uuid]).to be(undefined)
      
      it "should remove object from attribute indexes", ->
        method = ST.Model.Index.removeObject
        ST.Model.Index.shouldReceive 'removeObject'
        @model.forget()
        ST.Model.Index.removeObject = method
        
      it "should remove from persistant storage", ->
        ST.Model.Storage = {}
        @model._uuid = 'test'
        ST.Model.Storage.shouldReceive('remove').with('test')
        @model.forget()
        delete ST.Model.Storage

    describe "#destroy", ->
      it "should store destruction in change list", ->
        ST.Model._changes = []
        uuid = @model.uuid()
        @model.destroy()
        ST.Model._changes.length.should equal(1)
        change = ST.Model._changes[0]
        change.uuid.shouldNot be(null)
        change.model.should equal('TestModel')
        change.type.should equal('destroy')
        change.objectUuid.should equal(uuid)
      
      it "should forget object", ->
        @model.shouldReceive 'forget'
        @model.destroy()
    
    describe ".attribute", ->
      beforeEach ->
        ST.TestModel.attribute 'bar', 'string', 'bacon'
      
      it "should register default value for attribute", ->
        ST.TestModel.Attributes['bar'].should equal('bacon')
      
      it "should create a getter method", ->
        @model.getBar.should beAFunction
        
      it "should create a setter method", ->
        @model.setBar.should beAFunction
        
      it "should create an accessor method", ->
        @model.bar.should beAFunction
      
      describe "#set(Attribute)", ->
        it "should set new value", ->
          @model.bar 'waffles'
          @model.bar().should equal('waffles')
          
        it "should update an attribute index"
          
        it "should trigger _changed event", ->
          @model.bar 'bacon'
          @model.shouldReceive('_changed').with('bar', 'bacon', 'waffles')
          @model.bar 'waffles'
      
      describe "#get(Attribute)", ->
        it "should return attribute value", ->
          @model.bar 'waffles'
          @model.bar().should equal('waffles')
      
      it "should create condition generators", ->
        expect(ST.TestModel.bar).notTo be(null)
        ST.TestModel.bar.equals.should beAFunction
        
      describe "equals condition generator", ->
        beforeEach ->
          @condition = ST.TestModel.bar.equals('bacon')
      
        it "should have correct attribute name", ->
          @condition.attribute.should equal('bar')
          
        it "should have correct value", ->
          @condition.value.should equal('bacon')
        
        it "should test correct value", ->
          @condition.test('bacon').should beTrue
        
        it "should test incorrect value", ->
          @condition.test('waffles').should beFalse
    
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