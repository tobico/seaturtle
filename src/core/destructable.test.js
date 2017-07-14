import { Destructable } from './destructable'
import { makeClass } from './make-class'

describe("Destructable", function() {
  describe("#init", () =>
    it("should set _retainCount to 1", function() {
      const test = new Destructable();
      test.init();
      expect(test._retainCount).toEqual(1);
    })
  );

  describe(".destructor", () =>
    it("should create #destroy", function() {
      let called = false
      const Test = makeClass('Test', Destructable, (def) => {
        def.destructor(function() {
          called = true
          this.super();
        });
      });
      const test = Test.create();
      test.destroy();
      expect(called).toBe(true)
    })
  );
      
  describe(".retainedProperty", function() {
    let Test, test

    beforeEach(function() {
      Test = makeClass('Test', Destructable, (def) => {
        def.retainedProperty('foo');
      });
      test = Test.create();
    });

    it("should create property", function() {
      expect(test.foo).toBeInstanceOf(Function)
    });
    
    it("should add property to class list of retained properties", () => expect(Test._retainedProperties).toEqual(['foo']));

    describe("#getFoo", () =>
      it("should get the value of assigned attribute", function() {
        const a = Test.create();
        test._foo = a;
        expect(test.getFoo()).toBe(a);
      })
    );

    describe("#setFoo", function() {
      it("should set the value of assigned attribute", function() {
        const a = Test.create();
        test.foo(a);
        expect(test._foo).toBe(a);
      });
        
      it("should release old value", function() {
        const a = Test.create();
        test._foo = a;
        a.release = jest.fn()
        test.foo(null);
        expect(a.release).toBeCalled()
      });
      
      it("should retain new value", function() {
        const a = Test.create();
        a.retain = jest.fn()
        test.foo(a);
        expect(a.retain).toBeCalled()
      });
      
      it("should not retain or release when setting to same value", function() {
        const a = Test.create();
        test._foo = a;
        a.retain = jest.fn()
        a.release = jest.fn()
        test.foo(a);
        expect(a.retain).not.toBeCalled()
        expect(a.release).not.toBeCalled()
      });
      
      it("should call _changed method", function() {
        const a = Test.create();
        const b = Test.create();
        test._foo = a;
        test._changed = jest.fn()
        test.foo(b);
        expect(test._changed).toBeCalledWith('foo', a, b)
      });
    });
  });
  
  describe("with a new destructable", function() {
    let test

    beforeEach(function() {
      test = Destructable.create();
    });
    
    describe("#destroy", function() {
      it("should release retained properties of class", function() {
        const Test = makeClass('Test', Destructable, (def) => {
          def.retainedProperty('foo');
        });
        const test = Test.create();
        const child = Destructable.create();
        test.foo(child);
        child.release = jest.fn()
        test.destroy();
        expect(child.release).toBeCalled()
      });
        
      it("should release retained properties of superclass", function() {
        const Test = makeClass('Test', Destructable, (def) => {
          def.retainedProperty('foo');
        });
        const SubTest = makeClass('SubTest', Test, (def) => {
          def.retainedProperty('bar');
        });
        const test = SubTest.create();
        const child = Destructable.create();
        test.foo(child);
        child.release = jest.fn()
        test.destroy();
        expect(child.release).toBeCalled()
      });
      
      it("should set __proto__ to Object", function() {
        test.destroy();
        if (test.__proto__) { expect(test.__proto__).toBe(Object); }
      });
      
      it("should delete any attrs or methods except _class and _uid", function() {
        const uid = test._uid;
        test._foo = 'bacon';
        test.bar = () => 'waffles';
        test.destroy();
        expect(test._foo).toBe(undefined);
        expect(test.bar).toBe(undefined);
        expect(test._uid).toEqual(uid);
        expect(test._class).toBe(Destructable);
      });
      
      it("should set _destroyed", function() {
        test.destroy();
        expect(test._destroyed).toBe(true)
      });
      
      it("should replace toString", function() {
        const uid = test._uid;
        test.destroy();
        expect(String(test)).toEqual(`<Destroyed Destructable #${uid}>`);
      });
    });
    
    describe("#retain", () =>
      it("should increase _retainCount", function() {
        test.retain();
        expect(test._retainCount).toEqual(2);
      })
    );
    
    describe("#release", function() {
      it("should decrease _retainCount", function() {
        test.retain();
        test.release();
        expect(test._retainCount).toEqual(1);
      });
      
      it("should call destroy if _retainCount is 0", function() {
        test.destroy = jest.fn()
        test.release();
        expect(test.destroy).toBeCalled()
      });
      
      it("should not call destroy if _retainCount is > 0", function() {
        test.destroy = jest.fn()
        test.retain();
        test.release();
        expect(test.destroy).not.toBeCalled()
      });
    });
  });
});
