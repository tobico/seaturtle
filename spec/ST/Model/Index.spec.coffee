#require ST/Model/Index

$ ->
  ST.Spec.describe "Model/Index", ->
    beforeEach ->
      @index = ST.Model.Index.createWithModelAttribute(ST.Model, 'test')
      
    describe "#createWithModelAttribute", ->
      it "should set model", ->
        @index.model().should be(ST.Model)
      
      it "should set attribute", ->
        @index.attribute().should equal('test')
      
      it "should create empty byValue object", ->
        @index._byValue.should beAnInstanceOf(Object)
    
    describe "#id", ->
      it "should return unique ID for index", ->
        @index.id().should equal('Model#test')
    
    describe "#modelCreated", ->
      it "should create index for model", ->
        @index.modelCreated {test: -> 'bacon'}
        @index._byValue.bacon.shouldNot be(undefined)
      
      it "should add object to index", ->
        object = {test: -> 'bacon'}
        @index.modelCreated object
        @index._byValue.bacon[0].should be(object)
    
    describe "#modelDestroyed", ->
      it "should remove object from index", ->
        object = {test: -> 'bacon'}
        @index.modelCreated object
        @index.modelDestroyed object
        @index._byValue.bacon.length.should equal(0)