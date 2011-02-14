$ ->
 ST.Spec.describe "List", ->
  beforeEach ->
    @list = ST.List.create()
 
  describe "initializer", ->
    it "should create a new list", ->
      list = ST.List.create()
      list.$.should be(ST.List)
    
    it "should create an empty array", ->
      list = ST.List.create()
      list.array.should beAnInstanceOf(Array)
      list.array.length.should equal(0)
  
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
    it "should retain object", ->
      object = ST.Object.create()
      object.shouldReceive 'retain'
      @list.add object