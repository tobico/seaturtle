import { BaseObject } from './base-object'
import { makeClass } from './make-class'

describe("BaseObject", () =>
  describe("with a test subclass", function() {
    let Test

    beforeEach(() =>
      Test = makeClass('Test', BaseObject, (def) => null)
    );

    describe(".classMethod", function() {
      it("should define a new class method", function() {
        const def = jest.fn()
        Test.classMethod('test', def);
        Test.test()
        expect(def).toBeCalled()
      });
  
      it("should inherit to subclasses", function() {
        const def = jest.fn()
        Test.classMethod('test', def);
        const SubTest = makeClass('SubTest', Test, () => null)
        SubTest.test()
        expect(def).toBeCalled()
      });
    });
    
    describe(".method", function() {
      it("should define a new instance method", function() {
        const def = jest.fn()
        Test.method('test', def);
        const test = Test.create();
        test.test()
        expect(def).toBeCalled()
      });

      it("should inherit to subclasses", function() {
        const def = jest.fn()
        Test.method('test', def);
        const SubTest = makeClass("SubTest", Test, () => null);
        const subTest = SubTest.create();
        subTest.test()
        expect(def).toBeCalled()
      });
        
      it("should override a superclass method", function() {
        const def = jest.fn()
        Test.method('test', def);
        const SubTest = makeClass("SubTest", Test, () => null);
        const subDef = jest.fn()
        SubTest.method('test', function() {
          this.super();
          subDef()
        });
        const subTest = SubTest.create();
        subTest.test()
        expect(def).toBeCalled()
        expect(subDef).toBeCalled()
      });
        
      it("should return existing method", function() {
        const test = () => false;
        Test.method('test', test);
        expect(Test.method('test').toString()).toEqual('Test#test');
      });
    });

    describe(".hybridMethod", function() {
      it("should define a class method", function() {
        let fn = () => null
        Test.classMethod = jest.fn()
        Test.hybridMethod('test', fn);
        expect(Test.classMethod).toBeCalledWith('test', fn)
      });

      it("should define an instance method", function() {
        const fn = () => null;
        Test.method = jest.fn()
        Test.hybridMethod('test', fn);
        expect(Test.method).toBeCalledWith('test', fn)
      });
    });
    
    describe(".initializer", function() {
      it("should override an init method", function() {
        const def = jest.fn()
        Test.initializer(def);
        const test = new Test();
        test.init();
        expect(def).toBeCalled()
      });
      
      it("should make a create method", () => expect(Test.create).toBeInstanceOf(Function))
      
      it("should create a named initializer", function() {
        const def = jest.fn()
        Test.initializer('withBacon', function(bacon) {
          this.init();
          if (bacon === 'bacon') { def() }
        });
        const test = new Test();
        test.initWithBacon('bacon');
        expect(def).toBeCalled()
      });
      
      it("should make a named create method", function() {
        Test.initializer('withBacon', bacon => null);
        expect(Test.createWithBacon).toBeInstanceOf(Function)
      });
    });
    
    describe(".property", function() {
      let test

      beforeEach(function() {
        Test.property('foo');
        test = Test.create()
      });
    
      it("should create property", function() {
        expect(test.foo).toBeInstanceOf(Function)
      });
      
      it("should call getter", function() {
        test.getFoo = jest.fn()
        test.foo();
        expect(test.getFoo).toBeCalled()
      });
      
      it("should call setter", function() {
        test.setFoo = jest.fn()
        test.foo('bacon');
        expect(test.setFoo).toBeCalledWith('bacon')
      });
      
      it("should call setter with null attribute", function() {
        test.setFoo = jest.fn()
        test.foo(null);
        expect(test.setFoo).toBeCalledWith(null)
      });

      describe("#getFoo", () =>
        it("should get the value of assigned attribute", function() {
          test._foo = 'bacon';
          expect(test.getFoo()).toEqual('bacon')
        })
      );

      describe("#setFoo", function() {
        it("should set the value of assigned attribute", function() {
          test.setFoo('bacon');
          expect(test._foo).toEqual('bacon')
        });

        it("should call _changed method", function() {
          test._foo = 'waffles';
          test._changed = jest.fn()
          test.setFoo('bacon');
          expect(test._changed).toBeCalledWith('foo', 'waffles', 'bacon')
        });
        
        it("should call _fooChanged method", function() {
          test._foo = 'waffles';
          test._fooChanged = jest.fn()
          test.setFoo('bacon');
          expect(test._fooChanged).toBeCalledWith('waffles', 'bacon');
        });
        
        it("should trigger changed event", function() {
          test._foo = 'waffles';
          test.trigger = jest.fn()
          test.setFoo('bacon');
          expect(test.trigger).toBeCalledWith('changed', 'foo', 'waffles', 'bacon')
        });
      });
    });
    
    describe(".delegate", function() {
      let test

      beforeEach(function() {
        Test.delegate('foo', 'parent');
        test = Test.create();
      });
    
      it("should return public attribute of attribute", function() {
        test._parent = {foo: 'bacon'};
        expect(test.foo()).toEqual('bacon')
      });
      
      it("should call method of attribute", function() {
        test._parent = {
          foo() { return 'bacon'; }
        };
        expect(test.foo()).toEqual('bacon')
      });
      
      it("should pass through arguments", function() {
        const parent = [];
        parent.foo = jest.fn()
        test._parent = parent;
        test.foo('bacon');
        expect(parent.foo).toBeCalledWith('bacon')
      });
        
      it("should return public attribute of method result", function() {
        test.parent = () => ({foo: 'bacon'});
        expect(test.foo()).toEqual('bacon')
      });
      
      it("should call method of method result", function() {
        test.parent = () => ({
          foo() { return 'bacon'; }
        }) ;
        expect(test.foo()).toEqual('bacon');
      });
        
      it("should delgate under an alias", function() {
        Test.delegate('foo', 'parent', 'bar');
        test._parent = {foo: 'bacon'};
        expect(test.bar()).toEqual('bacon')
      });
    });
        
    describe(".singleton", function() {
      beforeEach(() => Test.singleton());
    
      it("should create .instance method", () => expect(Test.instance).toBeInstanceOf(Function));
      
      describe(".instance", function() {
        it("should return an instance of class", function() {
          const test = Test.instance();
          expect(test).toBeInstanceOf(Test);
        });
        
        it("should always return the same object", function() {
          const a = Test.instance();
          const b = Test.instance();
          expect(a).toBe(b)
        });
      });
    });
  })
);
          
describe("#initializer", () =>
  it("should create a unique UID", function() {
    const a = BaseObject.create();
    const b = BaseObject.create();
    expect(a._uid).not.toEqual(b._uid)
  })
);

describe("with new object", function() {
  let object
  beforeEach(function() {
    object = BaseObject.create();
  });

  describe("#toString", () =>
    it("should return class name and UID", function() {
      expect(object.toString()).toEqual(`<BaseObject #${object._uid}>`);
    })
  );
    
  describe("#_changed", () =>
    it("should call _(key)Changed method", function() {
      object._fooChanged = jest.fn()
      object._changed('foo', 'waffles', 'bacon');
      expect(object._fooChanged).toBeCalledWith('waffles', 'bacon')
    })
  );

  describe("#set", function() {
    it("should call #setKey for single value", function() {
      object.setKey = jest.fn()
      object.set('foo', 'bacon');
      expect(object.setKey).toBeCalledWith('foo', 'bacon')
    });
    
    it("should set multiple values in hash", function() {
      object.set({
        foo: 'waffles',
        bar: 'bacon'
      });
      expect(object.foo).toEqual('waffles');
      expect(object.bar).toEqual('bacon');
    });
  });
  
  describe("#setKey", function() {
    it("should set attribute", function() {
      object.setKey('_foo', 'bacon');
      expect(object._foo).toEqual('bacon');
    });
    
    it("should call setter", function() {
      object.setFoo = jest.fn()
      object.setKey('foo', 'bacon')
      expect(object.setFoo).toBeCalledWith('bacon')
    });
    
    it("should set attribute of attribute", function() {
      object._parent = {_foo: 'waffles'};
      object.setKey('_parent._foo', 'bacon');
      expect(object._parent._foo).toEqual('bacon');
    });
    
    it("should call setter of attribute", function() {
      const parent = [];
      parent.setFoo = jest.fn()
      object._parent = parent;
      object.setKey('_parent.foo', 'bacon');
      expect(parent.setFoo).toBeCalledWith('bacon')
    });
    
    it("should set attribute through getter", function() {
      const parent = {_foo: 'waffles'};
      object.getParent = () => parent;
      object.setKey('parent._foo', 'bacon');
      expect(parent._foo).toEqual('bacon')
    });
    
    it("should traverse many objects to set value", function() {
      const planet = {_size: 100};
      const forest = {getPlanet() { return planet; }};
      const tree = {_forest: forest};
      object.getTree = () => tree;
      object.setKey('tree._forest.planet._size', 10000);
      expect(planet._size).toEqual(10000);
    });
  });
  
  describe("#get", function() {
    it("should call getter", function() {
      object.foo = () => 'bacon';
      expect(object.get('foo')).toEqual('bacon');
    });
    
    it("should get attribute through getter", function() {
      object.parent = () => ({foo() { return 'bacon'; }});
      expect(object.get('parent.foo')).toEqual('bacon');
    });
  });
      
  describe("#method", () =>
    it("should return encapsulated method", function() {
      const method = object.method('setKey');
      method('_foo', 'bacon');
      expect(object._foo).toEqual('bacon');
    })
  );
      
  describe("#bind", function() {
    it("should create an event binding", function() {
      const bound = [];
      object.bind('foo', bound);
      expect(object._bindings.foo.length).toEqual(1);
    });
    
    it("should set the correct receiver", function() {
      const bound = [];
      object.bind('foo', bound);
      expect(object._bindings.foo[0].receiver).toBe(bound);
    });
    
    it("should use trigger as default selector", function() {
      const bound = [];
      object.bind('foo', bound);
      expect(object._bindings.foo[0].selector).toEqual('foo');
    });
    
    it("should use specified selector", function() {
      const bound = [];
      object.bind('foo', bound, 'testFoo');
      expect(object._bindings.foo[0].selector).toEqual('testFoo');
    });
  });
  
  describe("#unbindOne", function() {
    it("should remove an event binding", function() {
      const bound = [];
      object.bind('foo', bound);
      object.unbindOne('foo', bound);
      expect(object._bindings.foo.length).toEqual(0);
    });
    
    it("should do nothing if no matching binding", function() {
      const bound = [];
      object.bind('foo', bound);
      object.unbindOne('bar', bound);
      expect(object._bindings.foo.length).toEqual(1);
    });
  });
  
  describe("#unbindAll", () =>
    it("should remove any event bindings", function() {
      const bound = [];
      object.bind('foo', bound);
      object.bind('bar', bound);
      object.unbindAll(bound);
      expect(object._bindings.foo.length).toEqual(0);
      expect(object._bindings.bar.length).toEqual(0);
    })
  );
  
  describe("#isBound", function() {
    it("should return false when no bindings", function() {
      expect(object.isBound()).toBe(false)
    });
    
    return it("should return true when there is a binding", function() {
      const bound = [];
      object.bind('foo', bound);
      expect(object.isBound()).toBe(true)
    });
  });
      
  describe("#trigger", function() {
    it("should trigger matching bindings", function() {
      const bound = [];
      bound.foo = jest.fn()
      object.bind('foo', bound);
      object.trigger('foo');
      expect(bound.foo).toBeCalled()
    });
    
    it("should call bindings with object as parameter", function() {
      const bound = [];
      bound.foo = jest.fn()
      object.bind('foo', bound);
      object.trigger('foo');
      expect(bound.foo).toBeCalledWith(object)
    });
    
    it("should pass through parameters to bound function", function() {
      const bound = [];
      bound.foo = jest.fn()
      object.bind('foo', bound);
      object.trigger('foo', 'bacon');
      expect(bound.foo).toBeCalledWith(object, 'bacon')
    });
  });
});
