import { EnumFieldView } from './enum-field-view'

describe('EnumFieldView', function() {
  let enumField

  beforeEach(function() {
    enumField = EnumFieldView.createWithValuesNull([['Bacon', 'bacon'], ['Waffles', 'waffles']], true)
  })
  
  describe("initializer", function() {
    it("should set defaults", function() {
      expect(enumField._value).toBe(null)
      expect(enumField._valueIndex).toEqual({})
      expect(enumField._selectElement).toBe(null)
      expect(enumField._id).toBe(null)
    })
    
    it("should set values", function() {
      expect(enumField._values).toEqual([['Bacon', 'bacon'], ['Waffles', 'waffles']])
    })
  })
  
  describe("#isValueValid", function() {
    it("should be false when null and not allowed", function() {
      enumField.allowNull(false)
      expect(enumField.isValueValid(null)).toBe(false)
    })
    
    it("should be true when null and allowed", function() {
      expect(enumField.isValueValid(null)).toBe(true)
    })
    
    it("should be true when value is in values", function() {
      expect(enumField.isValueValid('bacon')).toBe(true)
    })
  
    it("should be false when value is not in values", function() {
      expect(enumField.isValueValid('avacado')).toBe(false)
    })
  })
  
  describe("#render", function() {
    it("should create select element", function() {
      enumField.render()
      expect(enumField.selectElement()).not.toBe(null)
    })
    
    it("should set ID for select element", function() {
      enumField.id('foo')
      enumField.render()
      expect(enumField.selectElement().attr('id')).toEqual('foo')
    })
    
    it("should render options", function() {
      enumField.renderOptions = jest.fn()
      enumField.render()
      expect(enumField.renderOptions).toBeCalled()
    })
  })
  
  describe("#renderOptions", function() {
    it("should render options", function() {
      enumField.load()
      expect(enumField.selectElement().html()).toEqual('<option value="" selected="selected"></option><option value="bacon">Bacon</option><option value="waffles">Waffles</option>')
    })
    
    it("should mark value as selected", function() {
      enumField.value('bacon')
      enumField.load()
      expect(enumField.selectElement().html()).toEqual('<option value=""></option><option value="bacon" selected="selected">Bacon</option><option value="waffles">Waffles</option>')
    })
  })
  
  describe("#selectChanged", function() {
    it("should trigger submit on enter key", function() {
      enumField.trigger = jest.fn()
      enumField.selectChanged({which: 13})
      expect(enumField.trigger).toBeCalledWith('submit')
  })
    
    it("should update value with value of select", function() {
      enumField.load()
      enumField.selectElement()[0].selectedIndex = 1
      enumField.selectChanged()
      expect(enumField.value()).toEqual('bacon')
    })
          
    it("should report change", function() {
      enumField.load()
      enumField.setValue = jest.fn()
      enumField.selectElement()[0].selectedIndex = 1
      enumField.selectChanged()
      expect(enumField.setValue).toBeCalled()
    })
  })
  
  describe("#_setValue", () =>
    it("should update selected value", function() {
      enumField.load()
      enumField.value('waffles')
      expect(enumField.selectElement()[0].selectedIndex).toEqual(2)
    })
  )
  
  describe("#_valuesChanged", function() {
    it("should rerender options", function() {
      enumField.load()
      enumField.renderOptions = jest.fn()
      enumField.values(['Spam', 'spam'])
      expect(enumField.renderOptions).toBeCalled()
  })
    
    it("should set value to null if no longer valid", function() {
      enumField.value('bacon')
      enumField.values(['Spam', 'spam'])
      expect(enumField.value()).toBe(null)
    })
    
    it("should keep value if it's still valid", function() {
      enumField.value('waffles')
      enumField.values([['Waffles', 'waffles'], ['Pancakes', 'pancakes']])
      expect(enumField.value()).toEqual('waffles')
    })
  })
  
  describe("#_idChanged", () =>
    it("should update ID for input element", function() {
      enumField.id('foo')
      enumField.load()
      enumField.id('bar')
      expect(enumField.selectElement().attr('id')).toEqual('bar')
    })
  )
})
