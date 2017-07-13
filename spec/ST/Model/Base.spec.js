/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Model

let NextUUID = 0;
ST.Model._generateUUID = () => NextUUID++;

Spec.describe("Model/Base", function() {
  beforeEach(function() {
    ST.class('TestModel', ST.Model.Base, function() {
      this.string('foo', {default: 'bacon'});
      return this.index('foo');
    });
    return this.model = ST.TestModel.create();
  });
    
  describe(".scoped", () =>
    it("should return a new scope", function() {
      const scope = ST.TestModel.scoped();
      return scope.should(beAnInstanceOf(ST.Model.Scope));
    })
  );
  
  describe(".find", () =>
    it("should find model by uuid", function() {
      return ST.TestModel.find(this.model.uuid()).should(be(this.model));
    })
  );
  
  describe(".load", function() {
    it("should create a new model with data", function() {
      const model = ST.TestModel.load({uuid: 'test'});
      model.should(beAnInstanceOf(ST.TestModel));
      return model.uuid().should(equal('test'));
    });
    
    return it("should load an array of models", function() {
      ST.TestModel.load([
          {uuid: 'test-1'},
          {uuid: 'test-2'}
      ]);
      ST.TestModel.find('test-1').shouldNot(be(null));
      return ST.TestModel.find('test-2').shouldNot(be(null));
    });
  });
  
  describe(".index", function() {
    it("should create an index", function() {
      const index = ST.TestModel.index('foo');
      return index.should(beAnInstanceOf(ST.Model.Index));
    });
    
    return it("should return existing index", function() {
      const index = ST.TestModel.index('foo');
      return ST.TestModel.index('foo').should(be(index));
    });
  });
      
  describe(".saveToServer", () => it("should be tested"));
  
  describe("#init", () =>
    it("should call #initWithData", function() {
      const model = new ST.TestModel();
      model.shouldReceive('initWithData');
      return model.init();
    })
  );
  
  describe("#initWithData", function() {
    beforeEach(function() {
      return this.model = new ST.TestModel();
    });
    
    it("should generate a new UUID", function() {
      ST.Model._generateUUID = () => 'foo';
      this.model.initWithData({});
      return this.model.uuid().should(equal('foo'));
    });
      
    it("should accept an existing UUID", function() {
      this.model.initWithData({uuid: 'bar'});
      return this.model.uuid().should(equal('bar'));
    });
      
    it("should set attributes to their defaults", function() {
      this.model.initWithData({});
      return this.model.foo().should(equal('bacon'));
    });
      
    it("should load provided attributes", function() {
      this.model.initWithData({foo: 'waffles'});
      return this.model.foo().should(equal('waffles'));
    });
    
    return it("should apply bindings on one-to-many associations");
  });
  
  describe(".createWithData", function() {
    it("should create using correct model type if specified", function() {
      const model = ST.Model.Base.createWithData({model: 'TestModel'});
      return model.should(beAnInstanceOf(ST.TestModel));
    });
    
    it("should not create if specified model type is not found", function() {
      const model = ST.Model.Base.createWithData({model: 'Bacon'});
      return expect(model).to(be(null));
    });
    
    it("should return an existing object with same ID", function() {
      const model = ST.TestModel.createWithData({uuid: 'recreate', foo: 'bacon'});
      const another = ST.TestModel.createWithData({uuid: 'recreate', foo: 'waffles'});
      return another.should(be(model));
    });
    
    return it("should create a new object", function() {
      const model = ST.TestModel.createWithData({foo: 'bacon'});
      return model.should(beAnInstanceOf(ST.TestModel));
    });
  });
  
  describe("#setUuid", function() {
    it("should add object to global index", function() {
      const model = new ST.TestModel();
      model.uuid('test');
      return ST.Model._byUuid['test'].should(be(model));
    });
    
    it("should add object to model index", function() {
      const model = new ST.TestModel();
      model.uuid('test');
      return ST.TestModel._byUuid['test'].should(be(model));
    });
    
    return it("should do nothing if model already has ID", function() {
      const model = new ST.TestModel();
      model._uuid = "test";
      model.uuid('test');
      return ST.Model._byUuid['test'].shouldNot(be(model));
    });
  });
  
  describe("#matches", function() {
    it("should match when meets conditions", function() {
      return this.model.matches([ST.TestModel.foo.equals('bacon')]).should(beTrue);
    });

    return it("should not match when fails condition", function() {
      return this.model.matches([ST.TestModel.foo.equals('waffles')]).should(beFalse);
    });
  });
  
  describe("#getManyList", () => it("needs to be tested"));
      
  describe("#data", () =>
    it("should return data representation of object", function() {
      const data = this.model.data();
      expect(data).to(beAnInstanceOf(Object));
      return data.foo.should(equal('bacon'));
    })
  );
  
  describe("#persist", () =>
    it("should save object in persistant storage", function() {
      ST.Model._storage = new SpecObject();
      this.model._uuid = 'test';
      ST.Model._storage.shouldReceive('set').with('test', JSON.stringify(this.model.data()));
      this.model.persist();
      return delete ST.Model._storage;
    })
  );
  
  describe("#forget", function() {
    it("should remove object from global index", function() {
      const uuid = this.model.uuid();
      this.model.forget();
      return expect(ST.Model._byUuid[uuid]).to(be(undefined));
    });
    
    it("should remove object from model index", function() {
      const uuid = this.model.uuid();
      this.model.forget();
      return expect(ST.TestModel._byUuid[uuid]).to(be(undefined));
    });
    
    it("should remove object from attribute indexes", function() {
      ST.TestModel.index('foo').shouldReceive('remove').with('bacon', this.model);
      return this.model.forget();
    });
      
    return it("should remove from persistant storage", function() {
      ST.Model._storage = new SpecObject();
      this.model._uuid = 'test';
      ST.Model._storage.shouldReceive('remove').with('test');
      this.model.forget();
      return delete ST.Model._storage;
    });
  });

  describe("#destroy", () =>
    it("should forget object", function() {
      this.model.shouldReceive('forget');
      return this.model.destroy();
    })
  );
  
  describe(".convertValueToType", function() {
    it("should convert to string", function() {
      const value = ST.Model.Base.convertValueToType(10, 'string');
      return (typeof value).should(equal('string'));
    });
  
    it("should convert to real", function() {
      const value = ST.Model.Base.convertValueToType('5.5', 'real');
      (typeof value).should(equal('number'));
      return value.should(equal(5.5));
    });
  
    it("should convert to integer", function() {
      const value = ST.Model.Base.convertValueToType('5.3', 'integer');
      (typeof value).should(equal('number'));
      return value.should(equal(5));
    });

    it("should convert to datetime", function() {
      const value = ST.Model.Base.convertValueToType('01 Jan 2010 12:15:00', 'datetime');
      value.should(beAnInstanceOf(Date));
      return value.getTime().should(equal(1262308500000));
    });
  
    it("should convert to bool", function() {
      const value = ST.Model.Base.convertValueToType(17, 'bool');
      return value.should(equal(true));
    });
    
    return it("should not convert null", function() {
      const value = ST.Model.Base.convertValueToType(null, 'integer');
      return expect(value).to(be(null));
    });
  });
  
  describe(".attribute", function() {
    beforeEach(() => ST.TestModel.attribute('bar', 'string', {default: 'bacon'}));
    
    it("should register default value for attribute", () => ST.TestModel._attributes['bar'].default.should(equal('bacon')));
    
    it("should register type for attribute", () => ST.TestModel._attributes['bar'].type.should(equal('string')));
    
    it("should create a getter method", function() {
      return this.model.getBar.should(beAFunction);
    });
      
    it("should create a setter method", function() {
      return this.model.setBar.should(beAFunction);
    });
      
    it("should create an accessor method", function() {
      return this.model.bar.should(beAFunction);
    });
    
    describe("#set(Attribute)", function() {
      it("should set new value", function() {
        this.model.bar('waffles');
        return this.model.bar().should(equal('waffles'));
      });
        
      it("should update attribute index", function() {
        const index = ST.TestModel.index('bar');
        this.model.bar('bacon');
        index.shouldReceive('remove').with('bacon', this.model);
        index.shouldReceive('add').with('waffles', this.model);
        return this.model.bar('waffles');
      });
        
      return it("should trigger _changed event", function() {
        this.model.bar('bacon');
        this.model.shouldReceive('_changed').with('bar', 'bacon', 'waffles');
        return this.model.bar('waffles');
      });
    });
    
    describe("#get(Attribute)", () =>
      it("should return attribute value", function() {
        this.model.bar('waffles');
        return this.model.bar().should(equal('waffles'));
      })
    );
    
    it("should create condition generators", function() {
      expect(ST.TestModel.bar).notTo(be(null));
      return ST.TestModel.bar.equals.should(beAFunction);
    });
      
    return describe("equals condition generator", function() {
      beforeEach(function() {
        return this.condition = ST.TestModel.bar.equals('bacon');
      });
    
      it("should have correct attribute name", function() {
        return this.condition.attribute.should(equal('bar'));
      });
        
      it("should have correct value", function() {
        return this.condition.value.should(equal('bacon'));
      });
      
      it("should test correct value", function() {
        return this.condition.test({bar() { return 'bacon'; }}).should(beTrue);
      });
      
      return it("should test incorrect value", function() {
        return this.condition.test({bar() { return 'waffles'; }}).should(beFalse);
      });
    });
  });
  
  context("with an associated model", function() {
    beforeEach(() => ST.class('OtherModel', ST.Model.Base, function() {}));
    
    describe(".belongsTo", function() {
      beforeEach(() => ST.TestModel.belongsTo('other', {model: 'OtherModel'}));
      
      it("should create a Uuid attribute", function() {
        return this.model.otherUuid.should(beAFunction);
      });
      
      it("should create a getter method", function() {
        return this.model.getOther.should(beAFunction);
      });
      
      it("should create a setter method", function() {
        return this.model.setOther.should(beAFunction);
      });
      
      it("should create an accessor method", function() {
        return this.model.other.should(beAFunction);
      });
      
      it("should register virtual attribute", function() {
        const attr = ST.TestModel._attributes['other'];
        attr.virtual.should(beTrue);
        attr.type.should(equal('belongsTo'));
        return attr.model.should(equal('OtherModel'));
      });

      it("should apply bindings");
      
      describe("getter method", function() {
        it("should find object by uuid", function() {
          const other = ST.OtherModel.create();
          this.model.otherUuid(other.uuid());
          return this.model.other().should(be(other));
        });
        
        it("should be null when no uuid", function() {
          return expect(this.model.other()).to(be(null));
        });
        
        return it("should be null when no model with uuid", function() {
          this.model._attributes.otherUuid = 'nothing';
          return expect(this.model.other()).to(be(null));
        });
      });
      
      return describe("setter method", () =>
        it("should set uuid", function() {
          const other = ST.OtherModel.create();
          this.model.other(other);
          return this.model.otherUuid().should(equal(other.uuid()));
        })
      );
    });
  
    return describe(".hasMany", function() {
      beforeEach(function() {
        ST.OtherModel.belongsTo('test', {model: 'TestModel'});
        return ST.TestModel.hasMany('others', {model: 'OtherModel', foreign: 'test'});});
      
      it("should create a getter method for scope", function() {
        return this.model.others.should(beAFunction);
      });
        
      it("should store details of binding", function() {
        ST.TestModel.hasMany('boundOthers', {
          model:    'OtherModel',
          foreign:  'test',
          bind:     { changed: 'otherChanged' }
        });
        ST.TestModel._manyBinds.length.should(equal(1));
        ST.TestModel._manyBinds[0].assoc.should(equal('boundOthers'));
        ST.TestModel._manyBinds[0].from.should(equal('changed'));
        return ST.TestModel._manyBinds[0].to.should(equal('otherChanged'));
      });
      
      return describe("getter method", () =>
        it("should return a scope with conditions to match foreign key", function() {
          const scope = this.model.others();
          scope._model.should(be(ST.OtherModel));
          scope._conditions.length.should(equal(1));
          return scope._conditions[0].attribute.should(equal('testUuid'));
        })
      );
    });
  });
  
  return describe(".setStorage", function() {
    it("should set the persistant store");
    it("should save an existing model to persistant storage");
    return it("should load a model from persistant storage");
  });
});