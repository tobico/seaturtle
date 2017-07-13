/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Object

Spec.describe("Destructable", function() {
  describe("#init", () =>
    it("should set _retainCount to 1", function() {
      const test = new ST.Destructable();
      test.init();
      return test._retainCount.should(equal(1));
    })
  );

  describe(".destructor", () =>
    it("should create #destroy", function() {
      const called = expectation('to call custom destructor');
      ST.class('Test', 'Destructable', function() {
        return this.destructor(function() {
          called.meet();
          return this.super();
        });
      });
      const test = ST.Test.create();
      return test.destroy();
    })
  );
      
  describe(".retainedProperty", function() {
    beforeEach(function() {
      ST.class('Test', 'Destructable', function() {
        return this.retainedProperty('foo');
      });
      return this.test = ST.Test.create();
    });

    it("should create property", function() {
      return this.test.foo.should(beAFunction);
    });
    
    it("should add property to class list of retained properties", () => ST.Test._retainedProperties.should(equal(['foo'])));

    describe("#getFoo", () =>
      it("should get the value of assigned attribute", function() {
        const a = ST.Test.create();
        this.test._foo = a;
        return this.test.getFoo().should(be(a));
      })
    );

    return describe("#setFoo", function() {
      it("should set the value of assigned attribute", function() {
        const a = ST.Test.create();
        this.test.foo(a);
        return this.test._foo.should(be(a));
      });
        
      it("should release old value", function() {
        const a = ST.Test.create();
        this.test._foo = a;
        a.shouldReceive('release');
        return this.test.foo(null);
      });
      
      it("should retain new value", function() {
        const a = ST.Test.create();
        a.shouldReceive('retain');
        return this.test.foo(a);
      });
      
      it("should not retain or release when setting to same value", function() {
        const a = ST.Test.create();
        this.test._foo = a;
        a.shouldNotReceive('retain');
        a.shouldNotReceive('release');
        return this.test.foo(a);
      });
      
      return it("should call _changed method", function() {
        const a = ST.Test.create();
        const b = ST.Test.create();
        this.test._foo = a;
        this.test.shouldReceive('_changed').with('foo', a, b);
        return this.test.foo(b);
      });
    });
  });
  
  return context("with a new destructable", function() {
    beforeEach(function() {
      return this.test = ST.Destructable.create();
    });
    
    describe("#destroy", function() {
      it("should release retained properties of class", function() {
        ST.class('Test', 'Destructable', function() {
          return this.retainedProperty('foo');
        });
        const test = ST.Test.create();
        const child = ST.Destructable.create();
        test.foo(child);
        child.shouldReceive('release');
        return test.destroy();
      });
        
      it("should release retained properties of superclass", function() {
        ST.class('Test', 'Destructable', function() {
          return this.retainedProperty('foo');
        });
        ST.class('SubTest', 'Test', function() {
          return this.retainedProperty('bar');
        });
        const test = ST.SubTest.create();
        const child = ST.Destructable.create();
        test.foo(child);
        child.shouldReceive('release');
        test.destroy();
        return delete ST.SubTest;
      });
      
      it("should set __proto__ to Object", function() {
        this.test.destroy();
        if (this.test.__proto__) { return this.test.__proto__.should(be(Object)); }
      });
      
      it("should delete any attrs or methods except _class and _uid", function() {
        const uid = this.test._uid;
        this.test._foo = 'bacon';
        this.test.bar = () => 'waffles';
        this.test.destroy();
        expect(this.test._foo).to(be(undefined));
        expect(this.test.bar).to(be(undefined));
        this.test._uid.should(equal(uid));
        return this.test._class.should(be(ST.Destructable));
      });
      
      it("should set _destroyed", function() {
        this.test.destroy();
        return this.test._destroyed.should(beTrue);
      });
      
      return it("should replace toString", function() {
        const uid = this.test._uid;
        this.test.destroy();
        return String(this.test).should(equal(`<Destroyed Destructable #${uid}>`));
      });
    });
    
    describe("#retain", () =>
      it("should increase _retainCount", function() {
        this.test.retain();
        return this.test._retainCount.should(equal(2));
      })
    );
    
    return describe("#release", function() {
      it("should decrease _retainCount", function() {
        this.test.retain();
        this.test.release();
        return this.test._retainCount.should(equal(1));
      });
      
      it("should call destroy if _retainCount is 0", function() {
        this.test.shouldReceive('destroy');
        return this.test.release();
      });
      
      return it("should not call destroy if _retainCount is > 0", function() {
        this.test.retain();
        this.test.shouldNotReceive('destroy');
        return this.test.release();
      });
    });
  });
});