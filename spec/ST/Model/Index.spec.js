/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Model/Index

Spec.describe("Model/Index", function() {
  beforeEach(function() {
    return this.index = ST.Model.Index.createWithModelAttribute(ST.Model, 'test');
  });
    
  describe("#createWithModelAttribute", function() {
    it("should set model", function() {
      return this.index._model.should(be(ST.Model));
    });
    
    it("should set attribute", function() {
      return this.index._attribute.should(equal('test'));
    });
    
    it("should create empty values hash", function() {
      return expect(this.index._values).to(beAnInstanceOf(Object));
    });
    
    return it("should set default cardinality", function() {
      return this.index.cardinality().should(equal(0));
    });
  });
  
  describe("#get", function() {
    it("should create a new list", function() {
      return this.index.get('banana').should(beAnInstanceOf(ST.List));
    });
    
    it("should return an existing list", function() {
      const list = this.index.get('banana');
      return this.index.get('banana').should(be(list));
    });
    
    return it("should update cardinality", function() {
      this.index.get('banana');
      return this.index.cardinality().should(equal(1));
    });
  });
  
  describe("#add", () =>
    it("should add item to list", function() {
      const object = {};
      this.index.add('banana', object);
      return this.index.get('banana').indexOf(object).should(equal(0));
    })
  );
  
  return describe("#remove", function() {
    it("should remove item from list", function() {
      const object = {};
      this.index.add('banana', object);
      this.index.add('banana', 'Test');
      this.index.remove('banana', object);
      return this.index.get('banana').indexOf(object).should(equal(-1));
    });
    
    it("should remove list with last item", function() {
      const object = {};
      this.index.add('banana', object);
      this.index.remove('banana', object);
      return expect(this.index._values['banana']).to(be(undefined));
    });
    
    it("should not remove list if bound", function() {
      const object = {};
      this.index.add('banana', object);
      this.index.get('banana').bind('itemAdded', object, 'itemAdded');
      this.index.remove('banana', object);
      return expect(this.index._values['banana']).to(beAnInstanceOf(ST.List));
    });
    
    return it("should update cardinality when removing list", function() {
      const object = {};
      this.index.add('banana', object);
      this.index.remove('banana', object);
      return this.index.cardinality().should(equal(0));
    });
  });
});