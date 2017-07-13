/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Model

Spec.describe("Model/Scope", function() {
  beforeEach(function() {
    return this.scope = ST.Model.Base.scoped();
  });
    
  describe("#initWithModel", function() {
    beforeEach(function() {
      this.scope = new ST.Model.Scope();
      return this.scope.initWithModel(ST.Model);
    });

    it("should set @_model", function() {
      return this.scope._model.should(be(ST.Model));
    });
      
    return it("should set defaults", function() {
      this.scope._conditions.should(equal([]));
      return expect(this.scope._orders).to(be(null));
    });
  });
  
  describe("#initWithScope", function() {
    beforeEach(function() {
      this.condition = {attribute: 'foo', test() { return true; } };
      this.scope._conditions = [this.condition];
      this.scope._orders = ['foo'];
      return this.copy = ST.Model.Scope.createWithScope(this.scope);
    });
  
    it("should copy scope model", function() {
      return this.copy._model.should(be(this.scope._model));
    });
    
    it("should copy scope conditions", function() {
      this.copy._conditions.length.should(equal(1));
      return expect(this.copy._conditions[0]).to(be(this.condition));
    });
      
    return it("should copy scope order", function() {
      return this.copy._orders.should(equal(['foo']));
    });
  });
  
  describe("#model", () =>
    it("should return model", function() {
      return this.scope.model().should(be(ST.Model.Base));
    })
  );
  
  describe("#fork", function() {
    it("should copy scope", function() {
      const copy = this.scope.fork();
      return copy._model.should(be(ST.Model.Base));
    });
    
    return it("should run block on new scope", function() {
      let copy;
      const exp = expectation('run block');
      return copy = this.scope.fork(() => exp.meet());
    });
  });
  
  describe("#where", function() {
    it("should add conditions to fork of scope with no conditions", function() {
      const condition = {attribute: 'foo', test() { return true; } };
      const copy = this.scope.where(condition);
      return copy._conditions.should(equal([condition]));
    });
    
    return it("should combine conditions on fork of scope with conditions", function() {
      const condition1 = {attribute: 'foo', test() { return true; } };
      const condition2 = {attribute: 'bar', test() { return false; } };
      this.scope._conditions = [condition1];
      const copy = this.scope.where(condition2);
      return copy._conditions.should(equal([condition1, condition2]));
    });
  });
  
  describe("#order", () =>
    it("should set order on fork of scope", function() {
      const copy = this.scope.order('foo');
      return copy._orders.should(equal(['foo']));
    })
  );
  
  return context("with a test model", function() {
    beforeEach(function() {
      let uuid = 1;
      ST.Model._generateUUID = () => uuid++;
    
      return ST.class('TestModel', ST.Model.Base, function() {
        this.string('foo', 'bacon');
        return this.integer('cost', 1);
      });
    });
  
    describe("#enableBindings", () => it("should bind scope to a relevant attribute index"));
    
    describe("#each", function() {
      it("should iterate over items matched by scope", function() {
        const model = ST.TestModel.createWithData({foo: 'bacon'});
        const found = expectation('find matching model');
        return ST.TestModel.where(ST.TestModel.foo.equals('bacon')).each(function(item) {
          found.meet();
          return item.should(be(model));
        });
      });
    
      return it("should iterate over items in order", function() {
        const model1 = ST.TestModel.createWithData({foo: 'bacon', cost: 3});
        const model2 = ST.TestModel.createWithData({foo: 'waffles', cost: 2});
        const model3 = ST.TestModel.createWithData({foo: 'waffles', cost: 7});
        const found = expectation('find model').exactly(3).times;
        let index = 0;
        return ST.TestModel.order('cost').each(function(item) {
          index++;
          if (index === 1) { item.should(be(model2)); }
          if (index === 2) { item.should(be(model1)); }
          if (index === 3) { item.should(be(model3)); }
          return found.meet();
        });
      });
    });
  
    describe("#count", () =>
      it("should count number of items matched by scope", function() {
        const model = ST.TestModel.createWithData({foo: 'bacon'});
        return ST.TestModel.scoped().count().should(equal(1));
      })
    );
  
    describe("#destroyAll", () =>
      it("should destroy all items matched by scope", function() {
        const model = ST.TestModel.createWithData({foo: 'bacon'});
        ST.TestModel.scoped().destroyAll();
        return ST.TestModel.scoped().count().should(equal(0));
      })
    );
  
    describe("#build", () =>
      it("should create a new object using scope conditions as base data", function() {
        const model = ST.TestModel.where(ST.TestModel.foo.equals('banana')).build();
        return model.foo().should(equal('banana'));
      })
    );
  
    describe("#indexItemAdded", function() {
      it("should trigger event if item matches scope");
      return it("should do nothing if item doesn't match scope");
    });
  
    describe("#indexItemRemoved", function() {
      it("should trigger event if item matches scope");
      return it("should do nothing if item doesn't match scope");
    });
  
    return describe("#indexItemChanged", function() {
      it("should trigger event if item matches scope");
      return it("should do nothing if item doesn't match scope");
    });
  });
});