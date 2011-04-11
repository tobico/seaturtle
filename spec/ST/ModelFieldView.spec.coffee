#require ST/Model
#require ST/ModelFieldView

$ ->
  Spec.describe 'ModelFieldView', ->
    beforeEach ->
      ST.class 'TestModel', 'Model', ->
        @string 'title'
        @searchesOn 'title'
        @method 'toListItem', -> [@title()]
        @method 'toFieldText', -> @title()
      @model = ST.TestModel
      @modelField = ST.ModelFieldView.createWithModel @model
      @item = ST.TestModel.createWithData({title: 'test'})
  
    describe "initializer", ->
      it "should set model", ->
        @modelField._model.should be(@model)
      
      it "should set defaults", ->
        expect(@modelField._value).to be(null)
        expect(@modelField._inputValue).to be(null)
        @modelField._searching.should beFalse
        @modelField._searchValue.should equal('')
        expect(@modelField._results).to be(null)
        @modelField._canCreate.should beFalse
    
    describe "#initWithScope", ->
      beforeEach ->
        @field = new ST.ModelFieldView()
        @scope = ST.TestModel.where(ST.TestModel.title.equals('bananas'))
      
      it "should call initWithModel", ->
        @field.shouldReceive('initWithModel').with(ST.TestModel)
        @field.initWithScope @scope
      
      it "should set scope", ->
        @field.initWithScope @scope
        @field._scope.should be(@scope)
    
    describe "#render", ->
      it "should put current value in field", ->
        @modelField.value @item
        @modelField.render()
        @modelField.inputElement().val().should equal('test')
      
      it "should create result list element", ->
        @modelField.render()
        @modelField._resultListElement.should beAnInstanceOf(jQuery)
    
    describe "#inputFocus", ->
      it "should perform search when field has text", ->
        @modelField.load()
        @modelField.inputElement().val 'test'
        @modelField.shouldReceive 'performSearch'
        @modelField.inputFocus()
      
      it "should select all when field has a value", ->
        @modelField.render()
        @modelField.inputElement().val 'test'
        @modelField.value @item
        @modelField.inputElement().shouldReceive 'select'
        @modelField.inputFocus()
    
    describe "#inputBlur", ->
      it "should set value to null when input empty", ->
        @modelField.render()
        @modelField.value @item
        @modelField.inputElement().val ''
        @modelField.inputBlur()
        expect(@modelField.value()).to be(null)
      
      it "should choose selected result", ->
        @modelField.render()
        @modelField.inputElement().val 'test'
        @modelField._results = [[@item, 1]]
        @modelField._selectedResult = 0
        @modelField.inputBlur()
        @modelField.value().should be(@item)
      
      it "should display current value if no result selected", ->
        @modelField.render()
        @modelField.value @item
        @modelField.inputElement().val 'testing'
        @modelField.inputBlur()
        @modelField.inputElement().val().should equal('test')
    
    describe "#inputChanged", ->
      it "should update inputValue", ->
        @modelField.render()
        @modelField.inputElement().val 'bacon'
        @modelField.inputChanged()
        @modelField.inputValue().should equal('bacon')
    
    describe "#_inputValueChanged", ->
      it "should perform serach", ->
        @modelField.load()
        @modelField._focused = true
        @modelField.shouldReceive 'performSearch'
        @modelField._inputValueChanged 'bacon', 'waffles'
    
    describe "#_valueChanged", ->
      it "should display value in field", ->
        @modelField.load()
        @modelField.value @item
        @modelField.inputValue().should equal('test')
    
    describe "#_selectedResultChanged", ->
      it "should add 'selected' class to selected row"
      it "should remove 'selected' class from unselected row"
    
    describe "#inputKeyDown", ->
      it "should go to previous result when I press up"
      it "should wrap around when I press up"
      it "should go to next result when I press down"
      it "should wrap around when I press down"
      it "should blur input when I press enter"
      it "should deselect result and blur input when I press escape"
      it "should select corresponsing result when I press a number key"
    
    describe "#performSearch", ->
      it "should start search for keyword"
      it "should hide results with blank keyword", ->
        @modelField.load()
        @modelField.resultListElement().shouldReceive 'hide'
        @modelField.performSearch ''
    
    describe "#showResults", ->
      it "should display results"
    
    describe "#chooseResult", ->
      it "should display toFieldText text in input"
      it "should update value"