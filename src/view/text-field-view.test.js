import { TextFieldView } from './text-field-view'

describe('TextFieldView', function() {
  let textField

  beforeEach(function() {
    textField = TextFieldView.create()
  })
  
  describe("initializer", () =>
    it("should set defaults", function() {
      expect(textField._value).toEqual(null)
      expect(textField._autoTrim).toBe(true)
      expect(textField._placeholder).toEqual('')
      expect(textField._inputElement).toBe(null)
    })
  )
  
  describe("#setValue", function() {
    it("should set value", function() {
      textField.value('bacon')
      expect(textField._value).toEqual('bacon')
    })
    
    it("should change input element value", function() {
      textField.load()
      textField.value('bacon')
      expect(textField.inputElement().val()).toEqual('bacon')
    })
    
    it("should trigger _changed", function() {
      textField._changed = jest.fn()
      textField.value('bacon')
      expect(textField._changed).toBeCalled()
    })
  })
  
  describe("#render", function() {
    it("should create input element", function() {
      textField.render()
      expect(textField.inputElement()).not.toBe(null)
    })
    
    it("should set ID for input element", function() {
      textField.id('foo')
      textField.render()
      expect(textField.inputElement().attr('id')).toEqual('foo')
    })
    
    it("should put value into input element", function() {
      textField.value('bacon')
      textField.render()
      expect(textField.inputElement().val()).toEqual('bacon')
    })
    
    it("should put placeholder into input element", function() {
      textField.placeholder('bacon')
      textField.render()
      expect(textField.inputElement().val()).toEqual('bacon')
    })
  })
  
  describe("#inputChanged", function() {
    it("should trigger submit on enter key", function() {
      textField.load()
      const trigger = jest.spyOn(textField, 'trigger')
      textField.keyDown({which: 13})
      expect(trigger).toBeCalledWith('submit')
  })
    
    it("should update value with value of input", function() {
      textField.load()
      textField.inputElement().val('banana')
      textField.inputChanged()
      expect(textField.value()).toEqual('banana')
    })
    
    it("should autotrim value", function() {
      textField.load()
      textField.inputElement().val('   waffles    ')
      textField.inputChanged()
      expect(textField.value()).toEqual('waffles')
    })
    
    it("should report change", function() {
      textField.load()
      const _valueChanged = jest.spyOn(textField, '_valueChanged')
      textField.inputElement().val('   waffles    ')
      textField.inputChanged()
      expect(_valueChanged).toBeCalled()
    })
  })
  
  describe("#inputFocus", () =>
    it("should remove placeholder", function() {
      textField.placeholder('banana')
      textField.load()
      textField.inputFocus()
      expect(textField.inputElement().val()).toEqual('')
    })
  )
  
  describe("#inputBlur", () =>
    it("should display placeholder", function() {
      textField.placeholder('banana')
      textField.load()
      textField.inputElement().val('')
      textField.inputBlur()
      expect(textField.inputElement().val()).toEqual('banana')
    })
  )
  
  describe("#_placeholderChanged", () =>
    it("should update placeholder text", function() {
      textField.placeholder('banana')
      textField.load()
      textField.placeholder('waffles')
      expect(textField.inputElement().val()).toEqual('waffles')
    })
  )
  
  describe("#_idChanged", () =>
    it("should update ID for input element", function() {
      textField.id('foo')
      textField.load()
      textField.id('bar')
      expect(textField.inputElement().attr('id')).toEqual('bar')
    })
  )
})
