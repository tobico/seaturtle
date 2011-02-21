#require ST/Object

$ ->
 ST.Spec.describe "List", ->
  beforeEach ->
    @list = ST.List.create()
 
  describe "initializer", ->
    it "should create a new list", ->
      list = ST.List.create()
      list._class.should be(ST.List)
    
    it "should create an empty array", ->
      list = ST.List.create()
      list._array.should beAnInstanceOf(Array)
      list._array.length.should equal(0)
  
  describe "each", ->
    it "should iterate item", ->
      testItem = {}
      count = 0
      @list.add testItem
      @list.each (item) ->
        item.should be(testItem)
        count++
      count.should equal(1)
      
    it "should iterate multiple items", ->
      for i in [1..3]
        @list.add {}
      count = 0
      @list.each (item) -> count++
      count.should equal(3)
      
  describe "getAt", ->
    it "should return item at index", ->
      @list.add 'zero'
      @list.add 'one'
      @list.add 'two'
      @list.getAt(1).should equal('one')
    
    it "should return null if no item", ->
      expect(@list.getAt(1)).to be(null)
      
    it "should return null when called with non-number", ->
      expect(@list.getAt('banana')).to be(null)
      
  describe "count", ->
    it "should return 0 for empty list", ->
      @list.count().should equal(0)
      
    it "should return number of items in list", ->
      for i in [1..3]
        @list.add 'item'
      @list.count().should equal(3)
      
  describe "isEmpty", ->
    it "should be true for empty list", ->
      @list.isEmpty().should beTrue
    
    it "should be false for non-empty list", ->
      @list.add 'test'
      @list.isEmpty().should beFalse
      
  describe "last", ->
    it "should return null if empty list", ->
      expect(@list.last()).to be(null)
    
    it "should return last item in list", ->
      @list.add 'one'
      @list.add 'two'
      @list.last().should equal('two')
      
  describe "add", ->
    it "should call insertAt for last item", ->
      @list._array = [1, 2]
      object = {}
      @list.shouldReceive('insertAt').with(2, object)
      @list.add object
    
    it "should add object to empty list", ->
      object = 'test'
      @list.add object
      @list._array.length.should equal(1)
      @list._array[0].should equal('test')
  
    it "should add object to non-empty list", ->
      object = 'test'
      @list._array = [1, 2, 3]
      @list.add object
      @list._array.length.should equal(4)
      @list._array[3].should equal('test')
        
  describe "insertAt", ->
    it "should retain object", ->
      object = {}
      object.shouldReceive 'retain'
      @list.add object
      
    it "should insert at beginning of array", ->
      @list._array = [1, 2, 3]
      @list.insertAt 0, 'test'
      @list._array[0].should equal('test')
      @list._array[1].should equal(1)
    
    it "should insert in middle of array", ->
      @list._array = [1, 2, 3]
      @list.insertAt 2, 'test'
      @list._array[2].should equal('test')
      @list._array[3].should equal(3)
      @list._array[1].should equal(2)
      
    it "should bind list to changed event", ->
      object = {}
      object.shouldReceive('bind').with('changed', @list, 'itemChanged')
      @list.insertAt 0, object

    it "should trigger itemAdded event", ->
      object = {}
      @list.shouldReceive('trigger').with('itemAdded', object)
      @list.insertAt 0, object
      
  describe "addAndRelease", ->
    it "should call add", ->
      object = 'test'
      @list.shouldReceive('add').with(object)
      @list.addAndRelease object
    
    it "should release object", ->
      object = {}
      object.shouldReceive 'release'
      @list.addAndRelease object
  
  describe "removeAt", ->
    it "should ignore if no item at index", ->
      @list.removeAt 1
      @list._array.length.should equal(0)
    
    it "should remove item from array", ->
      @list._array = [1, 2, 3]
      @list.removeAt 1
      @list._array.length.should equal(2)
      @list._array[1].should equal(3)
    
    it "should unbind list from changed event", ->
      object = {}
      @list._array = [object]
      object.shouldReceive('unbind').with('changed', @list)
      @list.removeAt 0
      
    it "should trigger itemRemoved event", ->
      object = {}
      @list._array = [object]
      @list.shouldReceive('trigger').with('itemRemoved', object)
      @list.removeAt 0
    
    it "should release object", ->
      object = {}
      @list._array = [object]
      object.shouldReceive 'release'
      @list.removeAt 0
  
  describe "removeLast", ->
    it "should do nothing if list is empty", ->
      @list.removeLast().should beFalse
      
    it "should call removeAt for last item", ->
      @list._array = [1]
      @list.shouldReceive('removeAt').with(0)
      @list.removeLast()
      
  describe "remove", ->
    it "should find an item and remove it", ->
      @list._array = [1, 2, 3]
      @list.remove 2
      @list._array.length.should equal(2)
      @list._array[0].should equal(1)
      @list._array[1].should equal(3)
    
    it "should do nothing if item not found", ->
      @list._array = [1, 2, 3]
      @list.remove 4
      @list._array.length.should equal(3)
    
    it "should remove first item if multiple", ->
      @list._array = [1, 2, 2, 3]
      @list.remove 2
      @list._array.length.should equal(3)
  
  describe "append", ->
    it "should add items in other list to this one", ->
      @list._array = [1, 2, 3]
      other = ST.List.create();
      other._array = [4, 5, 6]
      @list.append other
      @list._array.length.should equal(6)
      @list._array[0].should equal(1)
      @list._array[3].should equal(4)
      
  describe "copy", ->
    it "should make a new list object", ->
      other = @list.copy()
      other.should beAnInstanceOf(ST.List)
      other.shouldNot be(@list)
      
  describe "empty", ->
    it "should clear list", ->
      @list._array = [1, 2, 3]
      @list.shouldReceive('removeLast').andPassthrough().exactly(3).times
      @list.empty()
      @list._array.length.should equal(0)
      
    it "should release object", ->
      object = {}
      @list._array = [object]
      object.shouldReceive 'release'
      @list.empty()