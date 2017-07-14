import { List } from './list'

describe("List", function() {
  let list

  beforeEach(function() {
    list = List.create();
  });
 
  describe("initializer", function() {
    it("should create a new list", function() {
      expect(list._class).toBe(List);
    });
    
    it("should create an empty array", function() {
      const list = List.create();
      expect(list._array).toBeInstanceOf(Array);
      expect(list._array.length).toEqual(0);
    });
  });
  
  describe("initWithArray", () =>
    it("should make list from array", function() {
      const array = [1, 2, 3];
      const list = List.createWithArray(array);
      expect(list._array).toBe(array);
    })
  );
  
  describe("each", function() {
    it("should iterate item", function() {
      const testItem = {};
      let count = 0;
      list.add(testItem);
      list.each(function(item) {
        expect(item).toBe(testItem);
        count++;
      });
      expect(count).toEqual(1);
    });
      
    it("should iterate multiple items", function() {
      for (let i = 1; i <= 3; i++) {
        list.add({});
      }
      let count = 0;
      list.each(item => count++);
      expect(count).toEqual(3);
    });
  });
      
  describe("getAt", function() {
    it("should return item at index", function() {
      list.add('zero');
      list.add('one');
      list.add('two');
      expect(list.getAt(1)).toEqual('one');
    });
    
    it("should return null if no item", function() {
      expect(list.getAt(1)).toBe(null);
    });
      
    it("should return null when called with non-number", function() {
      expect(list.getAt('banana')).toBe(null);
    });
  });
      
  describe("count", function() {
    it("should return 0 for empty list", function() {
      expect(list.count()).toEqual(0);
    });
      
    it("should return number of items in list", function() {
      for (let i = 1; i <= 3; i++) {
        list.add('item');
      }
      expect(list.count()).toEqual(3);
    });
  });
      
  describe("isEmpty", function() {
    it("should be true for empty list", function() {
      expect(list.isEmpty()).toBe(true);
    });
    
    it("should be false for non-empty list", function() {
      list.add('test');
      expect(list.isEmpty()).toBe(false);
    });
  });
      
  describe("last", function() {
    it("should return null if empty list", function() {
      expect(list.last()).toBe(null);
    });
    
    it("should return last item in list", function() {
      list.add('one');
      list.add('two');
      expect(list.last()).toEqual('two');
    });
  });
      
  describe("add", function() {
    it("should call insertAt for last item", function() {
      list._array = [1, 2];
      const object = {};
      list.insertAt = jest.fn()
      list.add(object);
      expect(list.insertAt).toBeCalledWith(2, object)
    });
    
    it("should add object to empty list", function() {
      const object = 'test';
      list.add(object);
      expect(list._array.length).toEqual(1);
      expect(list._array[0]).toEqual('test');
    });
  
    it("should add object to non-empty list", function() {
      const object = 'test';
      list._array = [1, 2, 3];
      list.add(object);
      expect(list._array.length).toEqual(4);
      expect(list._array[3]).toEqual('test');
    });
  });
        
  describe("insertAt", function() {
    it("should retain object", function() {
      const object = [];
      object.retain = jest.fn()
      list.add(object);
      expect(object.retain).toBeCalled()
    });
      
    it("should insert at beginning of array", function() {
      list._array = [1, 2, 3];
      list.insertAt(0, 'test');
      expect(list._array[0]).toEqual('test')
      expect(list._array[1]).toEqual(1);
    });
    
    it("should insert in middle of array", function() {
      list._array = [1, 2, 3];
      list.insertAt(2, 'test');
      expect(list._array[2]).toEqual('test');
      expect(list._array[3]).toEqual(3);
      expect(list._array[1]).toEqual(2);
    });
      
    it("should bind list to changed event", function() {
      const object = [];
      object.bind = jest.fn()
      list.insertAt(0, object);
      expect(object.bind).toBeCalledWith('changed', list, 'itemChanged')
    });

    it("should trigger itemAdded event", function() {
      const object = [];
      list.trigger = jest.fn()
      list.insertAt(0, object);
      expect(list.trigger).toBeCalledWith('itemAdded', object, 0);
    });
  });
      
  describe("addAndRelease", function() {
    it("should call add", function() {
      const object = 'test';
      list.add = jest.fn()
      list.addAndRelease(object);
      expect(list.add).toBeCalledWith(object)
    });
    
    it("should release object", function() {
      const object = [];
      object.release = jest.fn()
      list.addAndRelease(object);
      expect(object.release).toBeCalled()
    });
  });
  
  describe("removeAt", function() {
    it("should ignore if no item at index", function() {
      list.removeAt(1);
      expect(list._array.length).toEqual(0);
    });
    
    it("should remove item from array", function() {
      list._array = [1, 2, 3];
      list.removeAt(1);
      expect(list._array.length).toEqual(2);
      expect(list._array[1]).toEqual(3);
    });
    
    it("should unbind list from changed event", function() {
      const object = [];
      list._array = [object];
      object.unbind = jest.fn()
      list.removeAt(0);
      expect(object.unbind).toBeCalledWith('changed', list);
    });
      
    it("should trigger itemRemoved event", function() {
      const object = [];
      list._array = [object];
      list.trigger = jest.fn()
      list.removeAt(0);
      expect(list.trigger).toBeCalledWith('itemRemoved', object, 0);
    });
    
    it("should release object", function() {
      const object = [];
      list._array = [object];
      object.release = jest.fn()
      list.removeAt(0);
      expect(object.release).toBeCalled()
    });
  });
  
  describe("removeLast", function() {
    it("should do nothing if list is empty", function() {
      expect(list.removeLast()).toBe(false);
    });
      
    it("should call removeAt for last item", function() {
      list._array = [1];
      list.removeAt = jest.fn()
      list.removeLast();
      expect(list.removeAt).toBeCalledWith(0)
    });
  });
      
  describe("remove", function() {
    it("should find an item and remove it", function() {
      list._array = [1, 2, 3];
      list.remove(2);
      expect(list._array.length).toEqual(2);
      expect(list._array[0]).toEqual(1);
      expect(list._array[1]).toEqual(3);
    });
    
    it("should do nothing if item not found", function() {
      list._array = [1, 2, 3];
      list.remove(4);
      expect(list._array.length).toEqual(3);
    });
    
    return it("should remove first item if multiple", function() {
      list._array = [1, 2, 2, 3];
      list.remove(2);
      expect(list._array.length).toEqual(3);
    });
  });
  
  describe("append", () =>
    it("should add items in other list to this one", function() {
      list._array = [1, 2, 3];
      const other = List.create();
      other._array = [4, 5, 6];
      list.append(other);
      expect(list._array.length).toEqual(6);
      expect(list._array[0]).toEqual(1);
      expect(list._array[3]).toEqual(4);
    })
  );
      
  describe("copy", () =>
    it("should make a new list object", function() {
      const other = list.copy();
      expect(other).toBeInstanceOf(List);
      expect(other).not.toBe(list);
    })
  );
      
  describe("empty", function() {
    it("should clear list", function() {
      list._array = [1, 2, 3];
      const realRemoveLast = list.removeLast
      list.removeLast = jest.fn(() => realRemoveLast.call(list))
      list.empty();
      expect(list.removeLast.mock.calls.length).toEqual(3)
      expect(list._array.length).toEqual(0);
    });
      
    it("should release object", function() {
      const object = [];
      list._array = [object];
      object.release = jest.fn()
      list.empty();
      expect(object.release).toBeCalled()
    });
  });
});
