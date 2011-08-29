#= require ST/EnumFieldView

Spec.describe 'EnumFieldView', ->
  beforeEach ->
    @enumField = ST.EnumFieldView.createWithValuesNull [['Bacon', 'bacon'], ['Waffles', 'waffles']], true
  
  describe "initializer", ->
    it "should set defaults", ->
      expect(@enumField._value).to be(null)
      expect(@enumField._valueIndex).to equal({})
      expect(@enumField._selectElement).to be(null)
      expect(@enumField._id).to be(null)
    
    it "should set values", ->
      expect(@enumField._values).to equal([['Bacon', 'bacon'], ['Waffles', 'waffles']])
  
  describe "#isValueValid", ->
    it "should be false when null and not allowed", ->
      @enumField.allowNull false
      @enumField.isValueValid(null).should beFalse
    
    it "should be true when null and allowed", ->
      @enumField.isValueValid(null).should beTrue
    
    it "should be true when value is in values", ->
      @enumField.isValueValid('bacon').should beTrue
  
    it "should be false when value is not in values", ->
      @enumField.isValueValid('avacado').should beFalse
  
  describe "#render", ->
    it "should create select element", ->
      @enumField.render()
      @enumField.selectElement().shouldNot be(null)
    
    it "should set ID for select element", ->
      @enumField.id 'foo'
      @enumField.render()
      @enumField.selectElement().attr('id').should equal('foo')
    
    it "should render options", ->
      @enumField.shouldReceive 'renderOptions'
      @enumField.render()
  
  describe "#renderOptions", ->
    it "should render options", ->
      @enumField.load()
      @enumField.selectElement().should haveHtml('<option value="" selected="selected"></option><option value="bacon">Bacon</option><option value="waffles">Waffles</option>')
    
    it "should mark value as selected", ->
      @enumField.value 'bacon'
      @enumField.load()
      @enumField.selectElement().should haveHtml('<option value=""></option><option value="bacon" selected="selected">Bacon</option><option value="waffles">Waffles</option>')
  
  describe "#selectChanged", ->
    it "should trigger submit on enter key", ->
      @enumField.shouldReceive('trigger').with('submit')
      @enumField.selectChanged {which: 13}
    
    it "should update value with value of select", ->
      @enumField.load()
      @enumField.selectElement()[0].selectedIndex = 1
      @enumField.selectChanged()
      @enumField.value().should equal('bacon')
          
    it "should report change", ->
      @enumField.load()
      @enumField.shouldReceive 'setValue'
      @enumField.selectElement()[0].selectedIndex = 1
      @enumField.selectChanged()
  
  describe "#_setValue", ->
    it "should update selected value", ->
      @enumField.load()
      @enumField.value 'waffles'
      @enumField.selectElement()[0].selectedIndex.should equal(2)
  
  describe "#_valuesChanged", ->
    it "should rerender options", ->
      @enumField.load()
      @enumField.shouldReceive 'renderOptions'
      @enumField.values ['Spam', 'spam']
    
    it "should set value to null if no longer valid", ->
      @enumField.value 'bacon'
      @enumField.values ['Spam', 'spam']
      expect(@enumField.value()).to be(null)
    
    it "should keep value if it's still valid", ->
      @enumField.value 'waffles'
      @enumField.values [['Waffles', 'waffles'], ['Pancakes', 'pancakes']]
      @enumField.value().should equal('waffles')
  
  describe "#_idChanged", ->
    it "should update ID for input element", ->
      @enumField.id 'foo'
      @enumField.load()
      @enumField.id 'bar'
      @enumField.selectElement().attr('id').should equal('bar')