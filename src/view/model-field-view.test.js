import { makeClass } from '../core/make-class'
import { ModelFieldView } from './model-field-view'
import { BaseModel } from '../model/base-model'

xdescribe('ModelFieldView', function() {
  let TestModel, model, modelField, item

  beforeEach(function() {
    TestModel = makeClass('TestModel', BaseModel, (def) => {
      def.string('title')
      def.searchesOn('title')
      def.method('toListItem', function() { return [this.title()] })
      def.method('toFieldText', function() { return this.title() })
    })
    model = TestModel
    modelField = ModelFieldView.createWithModel(model)
    item = TestModel.createWithData({title: 'test'})
  })

  describe("initializer", function() {
    it("should set model", function() {
      expect(modelField._model).toBe(model)
    })
    
    it("should set defaults", function() {
      expect(modelField._value).to(be(null))
      expect(modelField._inputValue).to(be(null))
      modelField._searching.should(beFalse)
      modelField._searchValue.should(equal(''))
      expect(modelField._results).to(be(null))
      modelField._canCreate.should(beFalse)
    })
  })
  
  describe("#initWithScope", function() {
    let field, scope

    beforeEach(function() {
      field = new ModelFieldView()
      scope = TestModel.where(TestModel.title.equals('bananas'))
    })
    
    it("should call initWithModel", function() {
      const initWithModel = jest.spyOn(field, 'initWithModel')
      field.initWithScope(scope)
      expect(initWithModel).toBeCalledWith(TestModel)
    })
    
    it("should set scope", function() {
      field.initWithScope(scope)
      expect(field._scope).toBe(scope)
    })
  })
  
  describe("#render", function() {
    it("should put current value in field", function() {
      modelField.value(item)
      modelField.render()
      expect(modelField.inputElement().val()).toEqual('test')
    })
    
    it("should create result list element", function() {
      modelField.render()
      expect(modelField._resultListElement).toBeInstanceOf(jQuery)
    })
  })
  
  describe("#inputFocus", function() {
    it("should perform search when field has text", function() {
      modelField.load()
      modelField.inputElement().val('test')
      modelField.performSearch = jest.fn()
      modelField.inputFocus()
      expect(modelField.performSearch).toBeCalled()
    })
    
    it("should select all when field has a value", function() {
      modelField.render()
      const inputElement = modelField.inputElement()
      inputElement.val('test')
      modelField.value(item)
      const select = jest.spyOn(inputElement, 'select')
      modelField.inputFocus()
      expect(select).toBeCalled()
    })
  })
  
  describe("#inputBlur", function() {
    it("should set value to null when input empty", function() {
      modelField.render()
      modelField.value(item)
      modelField._focused = true
      modelField.inputValue('')
      modelField.inputBlur()
      expect(modelField.value()).toBe(null)
    })
    
    it("should choose selected result", function() {
      modelField.render()
      modelField.inputElement().val('test')
      modelField._results = [[item, 1]]
      modelField._selectedResult = 0
      modelField.inputBlur()
      expect(modelField.value()).toBe(item)
    })
    
    it("should display current value if no result selected", function() {
      modelField.render()
      modelField.value(item)
      modelField.inputElement().val('testing')
      modelField.inputBlur()
      expect(modelField.inputElement().val()).toEqual('test')
    })
  })
  
  describe("#inputChanged", () => {
    it("should update inputValue", function() {
      modelField.render()
      modelField.inputElement().val('bacon')
      modelField.inputChanged()
      expect(modelField.inputValue()).toEqual('bacon')
    })
  })
  
  describe("#_inputValueChanged", () => {
    it("should perform serach", function() {
      modelField.load()
      modelField._focused = true
      modelField.performSearch = jest.fn()
      modelField._inputValueChanged('bacon', 'waffles')
      expect(modelField.performSearch).toBeCalled()
    })
  })
  
  describe("#_valueChanged", () => {
    it("should display value in field", function() {
      modelField.load()
      modelField.value(item)
      expect(modelField.inputValue()).toEqual('test')
    })
  })
  
  describe("#_selectedResultChanged", function() {
    it("should add 'selected' class to selected row")
    it("should remove 'selected' class from unselected row")
  })
  
  describe("#inputKeyDown", function() {
    it("should go to previous result when I press up")
    it("should wrap around when I press up")
    it("should go to next result when I press down")
    it("should wrap around when I press down")
    it("should blur input when I press enter")
    it("should deselect result and blur input when I press escape")
    it("should select corresponsing result when I press a number key")
  })
  
  describe("#performSearch", function() {
    it("should start search for keyword")
    it("should hide results with blank keyword")
  })
  
  describe("#showResults", () => it("should display results"))
  
  describe("#chooseResult", function() {
    it("should display toFieldText text in input")
    it("should update value")
  })
})
