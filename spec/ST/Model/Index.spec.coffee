#require ST/Model/Index

Spec.describe "Model/Index", ->
  beforeEach ->
    @index = ST.Model.Index.createWithModelAttribute(ST.Model, 'test')
    
  describe "#createWithModelAttribute", ->
    it "should set model", ->
      @index._model.should be(ST.Model)
    
    it "should set attribute", ->
      @index._attribute.should equal('test')
    
    it "should create empty values hash", ->
      expect(@index._values).to beAnInstanceOf(Object)
    
    it "should set default cardinality", ->
      @index.cardinality().should equal(0)
  
  describe "#get", ->
    it "should create a new list", ->
      @index.get('banana').should beAnInstanceOf(ST.List)
    
    it "should return an existing list", ->
      list = @index.get('banana')
      @index.get('banana').should be(list)
    
    it "should update cardinality", ->
      @index.get 'banana'
      @index.cardinality().should equal(1)
  
  describe "#add", ->
    it "should add item to list", ->
      object = {}
      @index.add 'banana', object
      @index.get('banana').indexOf(object).should equal(0)
  
  describe "#remove", ->
    it "should remove item from list", ->
      object = {}
      @index.add 'banana', object
      @index.add 'banana', 'Test'
      @index.remove 'banana', object
      @index.get('banana').indexOf(object).should equal(-1)
    
    it "should remove list with last item", ->
      object = {}
      @index.add 'banana', object
      @index.remove 'banana', object
      expect(@index._values['banana']).to be(undefined)
    
    it "should not remove list if bound", ->
      object = {}
      @index.add 'banana', object
      @index.get('banana').bind 'itemAdded', object, 'itemAdded'
      @index.remove 'banana', object
      expect(@index._values['banana']).to beAnInstanceOf(ST.List)
    
    it "should update cardinality when removing list", ->
      object = {}
      @index.add 'banana', object
      @index.remove 'banana', object
      @index.cardinality().should equal(0)