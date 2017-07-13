/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Object

Spec.describe("Object", () =>
  context("with a test subclass", function() {
    beforeEach(() => ST.class("Test", "Object", () => null));

    describe(".classMethod", function() {
      it("should define a new class method", function() {
        const called = expectation('method called');
        ST.Test.classMethod('test', () => called.meet());
        return ST.Test.test();
      });
  
      return it("should inherit to subclasses", function() {
        const called = expectation('method called');
        ST.Test.classMethod('test', () => called.meet());
        ST.class("SubTest", "Test", () => null);
        return ST.SubTest.test();
      });
    });
    
    describe(".method", function() {
      it("should define a new instance method", function() {
        const called = expectation('method called');
        ST.Test.method('test', () => called.meet());
        const test = ST.Test.create();
        return test.test();
      });

      it("should inherit to subclasses", function() {
        const called = expectation('method called');
        ST.Test.method('test', () => called.meet());
        ST.class("SubTest", "Test", () => null);
        const subTest = ST.SubTest.create();
        return subTest.test();
      });
        
      it("should override a superclass method", function() {
        const called = expectation('super class method called');
        ST.Test.method('test', () => called.meet());
        ST.class("SubTest", "Test", () => null);
        const subCalled = expectation('sub class method called');
        ST.SubTest.method('test', function() {
          this.super();
          return subCalled.meet();
        });
        const subTest = ST.SubTest.create();
        return subTest.test();
      });
        
      return it("should return existing method", function() {
        const test = () => false;
        ST.Test.method('test', test);
        return ST.Test.method('test').should(equal('Test#test'));
      });
    });

    describe(".hybridMethod", function() {
      it("should define a class method", function() {
        const fn = () => null;
        ST.Test.shouldReceive('classMethod').with('test', fn);
        return ST.Test.hybridMethod('test', fn);
      });

      return it("should define an instance method", function() {
        const fn = () => null;
        ST.Test.shouldReceive('method').with('test', fn);
        return ST.Test.hybridMethod('test', fn);
      });
    });
    
    describe(".initializer", function() {
      it("should override an init method", function() {
        const called = expectation('initializer called');
        ST.Test.initializer(() => called.meet());
        const test = new ST.Test();
        return test.init();
      });
      
      it("should make a create method", () => ST.Test.create.should(beAFunction));
      
      it("should create a named initializer", function() {
        const called = expectation('initializer called with argument');
        ST.Test.initializer('withBacon', function(bacon) {
          this.init();
          if (bacon === 'bacon') { return called.meet(); }
        });
        const test = new ST.Test();
        return test.initWithBacon('bacon');
      });
      
      return it("should make a named create method", function() {
        ST.Test.initializer('withBacon', bacon => null);
        return ST.Test.createWithBacon.should(beAFunction);
      });
    });
    
    describe(".property", function() {
      beforeEach(function() {
        ST.Test.property('foo');
        return this.test = ST.Test.create();
      });
    
      it("should create property", function() {
        return this.test.foo.should(beAFunction);
      });
      
      it("should call getter", function() {
        this.test.shouldReceive('getFoo');
        return this.test.foo();
      });
      
      it("should call setter", function() {
        this.test.shouldReceive('setFoo').with('bacon');
        return this.test.foo('bacon');
      });
      
      it("should call setter with null attribute", function() {
        this.test.shouldReceive('setFoo').with(null);
        return this.test.foo(null);
      });

      describe("#getFoo", () =>
        it("should get the value of assigned attribute", function() {
          this.test._foo = 'bacon';
          return this.test.getFoo().should(equal('bacon'));
        })
      );

      return describe("#setFoo", function() {
        it("should set the value of assigned attribute", function() {
          this.test.setFoo('bacon');
          return this.test._foo.should(equal('bacon'));
        });

        it("should call _changed method", function() {
          this.test._foo = 'waffles';
          this.test.shouldReceive('_changed').with('foo', 'waffles', 'bacon');
          return this.test.setFoo('bacon');
        });
        
        it("should call _fooChanged method", function() {
          this.test._foo = 'waffles';
          this.test.shouldReceive('_fooChanged').with('waffles', 'bacon');
          return this.test.setFoo('bacon');
        });
        
        return it("should trigger changed event", function() {
          this.test._foo = 'waffles';
          this.test.shouldReceive('trigger').with('changed', 'foo', 'waffles', 'bacon');
          return this.test.setFoo('bacon');
        });
      });
    });
    
    describe(".delegate", function() {
      beforeEach(function() {
        ST.Test.delegate('foo', 'parent');
        return this.test = ST.Test.create();
      });
    
      it("should return public attribute of attribute", function() {
        this.test._parent = {foo: 'bacon'};
        return this.test.foo().should(equal('bacon'));
      });
      
      it("should call method of attribute", function() {
        this.test._parent = {
          foo() { return 'bacon'; }
        };
        return this.test.foo().should(equal('bacon'));
      });
      
      it("should pass through arguments", function() {
        const parent = [];
        parent.shouldReceive('foo').with('bacon');
        this.test._parent = parent;
        return this.test.foo('bacon');
      });
        
      it("should return public attribute of method result", function() {
        this.test.parent = () => ({foo: 'bacon'});
        return this.test.foo().should(equal('bacon'));
      });
      
      it("should call method of method result", function() {
        this.test.parent = () => ({
          foo() { return 'bacon'; }
        }) ;
        return this.test.foo().should(equal('bacon'));
      });
        
      return it("should delgate under an alias", function() {
        ST.Test.delegate('foo', 'parent', 'bar');
        this.test._parent = {foo: 'bacon'};
        return this.test.bar().should(equal('bacon'));
      });
    });
        
    return describe(".singleton", function() {
      beforeEach(() => ST.Test.singleton());
    
      it("should create .instance method", () => ST.Test.instance.should(beAFunction));
      
      return describe(".instance", function() {
        it("should return an instance of class", function() {
          const test = ST.Test.instance();
          return test.should(beAnInstanceOf(ST.Test));
        });
        
        return it("should always return the same object", function() {
          const a = ST.Test.instance();
          const b = ST.Test.instance();
          return a.should(be(b));
        });
      });
    });
  })
);
          
describe("#initializer", () =>
  it("should create a unique UID", function() {
    const a = ST.Object.create();
    const b = ST.Object.create();
    return a._uid.shouldNot(equal(b._uid));
  })
);

context("with new object", function() {
  beforeEach(function() {
    return this.object = ST.Object.create();
  });

  describe("#toString", () =>
    it("should return class name and UID", function() {
      return this.object.toString().should(equal(`<Object #${this.object._uid}>`));
    })
  );
    
  describe("#_changed", () =>
    it("should call _(key)Changed method", function() {
      this.object.shouldReceive('_fooChanged').with('waffles', 'bacon');
      return this.object._changed('foo', 'waffles', 'bacon');
    })
  );

  describe("#set", function() {
    it("should call #setKey for single value", function() {
      this.object.shouldReceive('setKey').with('foo', 'bacon');
      return this.object.set('foo', 'bacon');
    });
    
    return it("should set multiple values in hash", function() {
      this.object.set({
        foo: 'waffles',
        bar: 'bacon'
      });
      this.object.foo.should(equal('waffles'));
      return this.object.bar.should(equal('bacon'));
    });
  });
  
  describe("#setKey", function() {
    it("should set attribute", function() {
      this.object.setKey('_foo', 'bacon');
      return this.object._foo.should(equal('bacon'));
    });
    
    it("should call setter", function() {
      this.object.shouldReceive('setFoo').with('bacon');
      return this.object.setKey('foo', 'bacon');
    });
    
    it("should set attribute of attribute", function() {
      this.object._parent = {_foo: 'waffles'};
      this.object.setKey('_parent._foo', 'bacon');
      return this.object._parent._foo.should(equal('bacon'));
    });
    
    it("should call setter of attribute", function() {
      const parent = [];
      parent.shouldReceive('setFoo').with('bacon');
      this.object._parent = parent;
      return this.object.setKey('_parent.foo', 'bacon');
    });
    
    it("should set attribute through getter", function() {
      const parent = {_foo: 'waffles'};
      this.object.getParent = () => parent;
      this.object.setKey('parent._foo', 'bacon');
      return parent._foo.should(equal('bacon'));
    });
    
    return it("should traverse many objects to set value", function() {
      const planet = {_size: 100};
      const forest = {getPlanet() { return planet; }};
      const tree = {_forest: forest};
      this.object.getTree = () => tree;
      this.object.setKey('tree._forest.planet._size', 10000);
      return planet._size.should(equal(10000));
    });
  });
  
  describe("#get", function() {
    it("should call getter", function() {
      this.object.foo = () => 'bacon';
      return this.object.get('foo').should(equal('bacon'));
    });
    
    return it("should get attribute through getter", function() {
      this.object.parent = () => ({foo() { return 'bacon'; }});
      return this.object.get('parent.foo').should(equal('bacon'));
    });
  });
      
  describe("#method", () =>
    it("should return encapsulated method", function() {
      const method = this.object.method('setKey');
      method('_foo', 'bacon');
      return this.object._foo.should(equal('bacon'));
    })
  );
      
  describe("#bind", function() {
    it("should create an event binding", function() {
      const bound = [];
      this.object.bind('foo', bound);
      return this.object._bindings.foo.length.should(equal(1));
    });
    
    it("should set the correct receiver", function() {
      const bound = [];
      this.object.bind('foo', bound);
      return this.object._bindings.foo[0].receiver.should(be(bound));
    });
    
    it("should use trigger as default selector", function() {
      const bound = [];
      this.object.bind('foo', bound);
      return this.object._bindings.foo[0].selector.should(equal('foo'));
    });
    
    return it("should use specified selector", function() {
      const bound = [];
      this.object.bind('foo', bound, 'testFoo');
      return this.object._bindings.foo[0].selector.should(equal('testFoo'));
    });
  });
  
  describe("#unbindOne", function() {
    it("should remove an event binding", function() {
      const bound = [];
      this.object.bind('foo', bound);
      this.object.unbindOne('foo', bound);
      return this.object._bindings.foo.length.should(equal(0));
    });
    
    return it("should do nothing if no matching binding", function() {
      const bound = [];
      this.object.bind('foo', bound);
      this.object.unbindOne('bar', bound);
      return this.object._bindings.foo.length.should(equal(1));
    });
  });
  
  describe("#unbindAll", () =>
    it("should remove any event bindings", function() {
      const bound = [];
      this.object.bind('foo', bound);
      this.object.bind('bar', bound);
      this.object.unbindAll(bound);
      this.object._bindings.foo.length.should(equal(0));
      return this.object._bindings.bar.length.should(equal(0));
    })
  );
  
  describe("#isBound", function() {
    it("should return false when no bindings", function() {
      return this.object.isBound().should(beFalse);
    });
    
    return it("should return true when there is a binding", function() {
      const bound = [];
      this.object.bind('foo', bound);
      return this.object.isBound().should(beTrue);
    });
  });
      
  return describe("#trigger", function() {
    it("should trigger matching bindings", function() {
      const bound = [];
      bound.shouldReceive('foo');
      this.object.bind('foo', bound);
      return this.object.trigger('foo');
    });
    
    it("should call bindings with object as parameter", function() {
      const bound = [];
      bound.shouldReceive('foo').with(this.object);
      this.object.bind('foo', bound);
      return this.object.trigger('foo');
    });
    
    return it("should pass through parameters to bound function", function() {
      const bound = [];
      bound.shouldReceive('foo').with(this.object, 'bacon');
      this.object.bind('foo', bound);
      return this.object.trigger('foo', 'bacon');
    });
  });
});