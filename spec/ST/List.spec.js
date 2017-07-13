/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Object

Spec.describe("List", function() {
  beforeEach(function() {
    return this.list = ST.List.create();
  });
 
  describe("initializer", function() {
    it("should create a new list", function() {
      const list = ST.List.create();
      return list._class.should(be(ST.List));
    });
    
    return it("should create an empty array", function() {
      const list = ST.List.create();
      list._array.should(beAnInstanceOf(Array));
      return list._array.length.should(equal(0));
    });
  });
  
  describe("initWithArray", () =>
    it("should make list from array", function() {
      const array = [1, 2, 3];
      const list = ST.List.createWithArray(array);
      return list._array.should(be(array));
    })
  );
  
  describe("each", function() {
    it("should iterate item", function() {
      const testItem = {};
      let count = 0;
      this.list.add(testItem);
      this.list.each(function(item) {
        expect(item).to(be(testItem));
        return count++;
      });
      return count.should(equal(1));
    });
      
    return it("should iterate multiple items", function() {
      for (let i = 1; i <= 3; i++) {
        this.list.add({});
      }
      let count = 0;
      this.list.each(item => count++);
      return count.should(equal(3));
    });
  });
      
  describe("getAt", function() {
    it("should return item at index", function() {
      this.list.add('zero');
      this.list.add('one');
      this.list.add('two');
      return this.list.getAt(1).should(equal('one'));
    });
    
    it("should return null if no item", function() {
      return expect(this.list.getAt(1)).to(be(null));
    });
      
    return it("should return null when called with non-number", function() {
      return expect(this.list.getAt('banana')).to(be(null));
    });
  });
      
  describe("count", function() {
    it("should return 0 for empty list", function() {
      return this.list.count().should(equal(0));
    });
      
    return it("should return number of items in list", function() {
      for (let i = 1; i <= 3; i++) {
        this.list.add('item');
      }
      return this.list.count().should(equal(3));
    });
  });
      
  describe("isEmpty", function() {
    it("should be true for empty list", function() {
      return this.list.isEmpty().should(beTrue);
    });
    
    return it("should be false for non-empty list", function() {
      this.list.add('test');
      return this.list.isEmpty().should(beFalse);
    });
  });
      
  describe("last", function() {
    it("should return null if empty list", function() {
      return expect(this.list.last()).to(be(null));
    });
    
    return it("should return last item in list", function() {
      this.list.add('one');
      this.list.add('two');
      return this.list.last().should(equal('two'));
    });
  });
      
  describe("add", function() {
    it("should call insertAt for last item", function() {
      this.list._array = [1, 2];
      const object = {};
      this.list.shouldReceive('insertAt').with(2, object);
      return this.list.add(object);
    });
    
    it("should add object to empty list", function() {
      const object = 'test';
      this.list.add(object);
      this.list._array.length.should(equal(1));
      return this.list._array[0].should(equal('test'));
    });
  
    return it("should add object to non-empty list", function() {
      const object = 'test';
      this.list._array = [1, 2, 3];
      this.list.add(object);
      this.list._array.length.should(equal(4));
      return this.list._array[3].should(equal('test'));
    });
  });
        
  describe("insertAt", function() {
    it("should retain object", function() {
      const object = [];
      object.shouldReceive('retain');
      return this.list.add(object);
    });
      
    it("should insert at beginning of array", function() {
      this.list._array = [1, 2, 3];
      this.list.insertAt(0, 'test');
      this.list._array[0].should(equal('test'));
      return this.list._array[1].should(equal(1));
    });
    
    it("should insert in middle of array", function() {
      this.list._array = [1, 2, 3];
      this.list.insertAt(2, 'test');
      this.list._array[2].should(equal('test'));
      this.list._array[3].should(equal(3));
      return this.list._array[1].should(equal(2));
    });
      
    it("should bind list to changed event", function() {
      const object = [];
      object.shouldReceive('bind').with('changed', this.list, 'itemChanged');
      return this.list.insertAt(0, object);
    });

    return it("should trigger itemAdded event", function() {
      const object = [];
      this.list.shouldReceive('trigger').with('itemAdded', object, 0);
      return this.list.insertAt(0, object);
    });
  });
      
  describe("addAndRelease", function() {
    it("should call add", function() {
      const object = 'test';
      this.list.shouldReceive('add').with(object);
      return this.list.addAndRelease(object);
    });
    
    return it("should release object", function() {
      const object = [];
      object.shouldReceive('release');
      return this.list.addAndRelease(object);
    });
  });
  
  describe("removeAt", function() {
    it("should ignore if no item at index", function() {
      this.list.removeAt(1);
      return this.list._array.length.should(equal(0));
    });
    
    it("should remove item from array", function() {
      this.list._array = [1, 2, 3];
      this.list.removeAt(1);
      this.list._array.length.should(equal(2));
      return this.list._array[1].should(equal(3));
    });
    
    it("should unbind list from changed event", function() {
      const object = [];
      this.list._array = [object];
      object.shouldReceive('unbind').with('changed', this.list);
      return this.list.removeAt(0);
    });
      
    it("should trigger itemRemoved event", function() {
      const object = [];
      this.list._array = [object];
      this.list.shouldReceive('trigger').with('itemRemoved', object, 0);
      return this.list.removeAt(0);
    });
    
    return it("should release object", function() {
      const object = [];
      this.list._array = [object];
      object.shouldReceive('release');
      return this.list.removeAt(0);
    });
  });
  
  describe("removeLast", function() {
    it("should do nothing if list is empty", function() {
      return this.list.removeLast().should(beFalse);
    });
      
    return it("should call removeAt for last item", function() {
      this.list._array = [1];
      this.list.shouldReceive('removeAt').with(0);
      return this.list.removeLast();
    });
  });
      
  describe("remove", function() {
    it("should find an item and remove it", function() {
      this.list._array = [1, 2, 3];
      this.list.remove(2);
      this.list._array.length.should(equal(2));
      this.list._array[0].should(equal(1));
      return this.list._array[1].should(equal(3));
    });
    
    it("should do nothing if item not found", function() {
      this.list._array = [1, 2, 3];
      this.list.remove(4);
      return this.list._array.length.should(equal(3));
    });
    
    return it("should remove first item if multiple", function() {
      this.list._array = [1, 2, 2, 3];
      this.list.remove(2);
      return this.list._array.length.should(equal(3));
    });
  });
  
  describe("append", () =>
    it("should add items in other list to this one", function() {
      this.list._array = [1, 2, 3];
      const other = ST.List.create();
      other._array = [4, 5, 6];
      this.list.append(other);
      this.list._array.length.should(equal(6));
      this.list._array[0].should(equal(1));
      return this.list._array[3].should(equal(4));
    })
  );
      
  describe("copy", () =>
    it("should make a new list object", function() {
      const other = this.list.copy();
      other.should(beAnInstanceOf(ST.List));
      return other.shouldNot(be(this.list));
    })
  );
      
  return describe("empty", function() {
    it("should clear list", function() {
      this.list._array = [1, 2, 3];
      this.list.shouldReceive('removeLast').andPassthrough().exactly(3).times;
      this.list.empty();
      return this.list._array.length.should(equal(0));
    });
      
    return it("should release object", function() {
      const object = [];
      this.list._array = [object];
      object.shouldReceive('release');
      return this.list.empty();
    });
  });
});