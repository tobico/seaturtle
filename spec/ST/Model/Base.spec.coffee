#require ST/Model

NextUUID = 0
ST.Model._generateUUID = -> NextUUID++

$ ->
  Spec.describe "Model/Base", ->
    beforeEach ->
      ST.class 'TestModel', ST.Model.Base, ->
        @string 'foo', 'bacon'
        @index 'foo'
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
    
    describe ".index", ->
      it "should create an index", ->
        index = ST.TestModel.index 'foo'
        index.should beAnInstanceOf(ST.Model.Index)
      
      it "should return existing index", ->
        index = ST.TestModel.index 'foo'
        ST.TestModel.index('foo').should be(index)
    
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
        ST.Model._generateUUID = -> 'foo'
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
        model = ST.Model.Base.createWithData {model: 'TestModel'}
        model.should beAnInstanceOf(ST.TestModel)
      
      it "should not create if specified model type is not found", ->
        model = ST.Model.Base.createWithData {model: 'Bacon'}
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
    
    describe "#serialize", ->
      it "should return a text representation of object", ->
        @model._uuid = 'test'
        @model.serialize().should equal('{"model":"TestModel","uuid":"test","foo":"bacon"}')
    
    describe "#persist", ->
      it "should save object in persistant storage", ->
        ST.Model._storage = {}
        @model._uuid = 'test'
        ST.Model._storage.shouldReceive('set').with('test', @model.serialize())
        @model.persist()
        delete ST.Model._storage
    
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
        ST.TestModel.index('foo').shouldReceive('remove').with 'bacon', @model
        @model.forget()
        
      it "should remove from persistant storage", ->
        ST.Model._storage = {}
        @model._uuid = 'test'
        ST.Model._storage.shouldReceive('remove').with('test')
        @model.forget()
        delete ST.Model._storage

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
    
    describe ".convertValueToType", ->
      it "should convert to string", ->
        value = ST.Model.Base.convertValueToType 10, 'string'
        (typeof value).should equal('string')
    
      it "should convert to real", ->
        value = ST.Model.Base.convertValueToType '5.5', 'real'
        (typeof value).should equal('number')
        value.should equal(5.5)
    
      it "should convert to integer", ->
        value = ST.Model.Base.convertValueToType '5.3', 'integer'
        (typeof value).should equal('number')
        value.should equal(5)

      it "should convert to datetime", ->
        value = ST.Model.Base.convertValueToType '01 Jan 2010 12:15:00', 'datetime'
        value.should beAnInstanceOf(Date)
        value.getTime().should equal(1262308500000)
    
      it "should convert to bool", ->
        value = ST.Model.Base.convertValueToType 17, 'bool'
        value.should equal(true)
      
      it "should not convert null", ->
        value = ST.Model.Base.convertValueToType null, 'integer'
        expect(value).to be(null)
    
    describe ".attribute", ->
      beforeEach ->
        ST.TestModel.attribute 'bar', 'string', 'bacon'
      
      it "should register default value for attribute", ->
        ST.TestModel._attributes['bar'].default.should equal('bacon')
      
      it "should register type for attribute", ->
        ST.TestModel._attributes['bar'].type.should equal('string')
      
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
          
        it "should update attribute index", ->
          index = ST.TestModel.index 'bar'
          @model.bar 'bacon'
          index.shouldReceive('remove').with('bacon', @model)
          index.shouldReceive('add').with('waffles', @model)
          @model.bar 'waffles'
          
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
    
    context "with an associated model", ->
      beforeEach ->
        ST.class 'OtherModel', ST.Model.Base, ->
      
      describe ".belongsTo", ->
        beforeEach ->
          ST.TestModel.belongsTo 'other', {model: 'OtherModel'}
        
        it "should create a Uuid attribute", ->
          @model.otherUuid.should beAFunction
        
        it "should create a getter method", ->
          @model.getOther.should beAFunction
        
        it "should create a setter method", ->
          @model.setOther.should beAFunction
        
        it "should create an accessor method", ->
          @model.other.should beAFunction
        
        it "should register virtual attribute", ->
          attr = ST.TestModel._attributes['other']
          attr.virtual.should beTrue
          attr.type.should equal('belongsTo')
          attr.model.should equal('OtherModel')

        it "should apply bindings"
        
        describe "getter method", ->
          it "should find object by uuid", ->
            other = ST.OtherModel.create()
            @model.otherUuid other.uuid()
            @model.other().should be(other)
          
          it "should be null when no uuid", ->
            expect(@model.other()).to be(null)
          
          it "should be null when no model with uuid", ->
            @model._attributes.otherUuid = 'nothing'
            expect(@model.other()).to be(null)
        
        describe "setter method", ->
          it "should set uuid", ->
            other = ST.OtherModel.create()
            @model.other other
            @model.otherUuid().should equal(other.uuid())
    
      describe ".hasMany", ->
        beforeEach ->
          ST.OtherModel.belongsTo 'test', {model: 'TestModel'}
          ST.TestModel.hasMany 'others', {model: 'OtherModel', foreign: 'test'}
        
        it "should create a getter method for scope", ->
          @model.others.should beAFunction
          
        it "should store details of binding", ->
          ST.TestModel.hasMany 'boundOthers', {
            model:    'OtherModel'
            foreign:  'test'
            bind:     { changed: 'otherChanged' }
          }
          ST.TestModel._manyBinds.length.should equal(1)
          ST.TestModel._manyBinds[0].assoc.should equal('boundOthers')
          ST.TestModel._manyBinds[0].from.should equal('changed')
          ST.TestModel._manyBinds[0].to.should equal('otherChanged')
        
        describe "getter method", ->
          it "should return a scope with conditions to match foreign key", ->
            scope = @model.others()
            scope._model.should be(ST.OtherModel)
            scope._conditions.length.should equal(1)
            scope._conditions[0].attribute.should equal('testUuid')
    
    describe ".setStorage", ->
      it "should set the persistant store"
      it "should save an existing model to persistant storage"
      it "should load a model from persistant storage"