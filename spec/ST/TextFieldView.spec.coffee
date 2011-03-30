#require ST/TextFieldView

$ ->
  Spec.describe 'TextFieldView', ->
    beforeEach ->
      @textField = ST.TextFieldView.create()
    
    describe "initializer", ->
      it "should set defaults", ->
        @textField._value.should equal('')
        @textField._autoTrim.should beTrue
        @textField._placeholder.should equal('')
        expect(@textField._inputElement).to be(null)
    
    describe "#setValue", ->
      it "should set value", ->
        @textField.value 'bacon'
        @textField._value.should equal('bacon')
      
      it "should change input element value", ->
        @textField.load()
        @textField.value 'bacon'
        @textField.inputElement().val().should equal('bacon')
      
      it "should trigger _changed", ->
        @textField.shouldReceive '_changed'
        @textField.value 'bacon'
    
    describe "#render", ->
      it "should create input element", ->
        @textField.render()
        @textField.inputElement().shouldNot be(null)
      
      it "should put value into input element", ->
        @textField.value 'bacon'
        @textField.render()
        @textField.inputElement().val().should equal('bacon')
      
      it "should put placeholder into input element", ->
        @textField.placeholder 'bacon'
        @textField.render()
        @textField.inputElement().val().should equal('bacon')
    
    describe "#inputChanged", ->
      it "should trigger submit on enter key", ->
        @textField.shouldReceive('trigger').with('submit')
        @textField.inputChanged {which: 13}
      
      it "should update value with value of input", ->
        @textField.load()
        @textField.inputElement().val 'banana'
        @textField.inputChanged()
        @textField.value().should equal('banana')
      
      it "should autotrim value", ->
        @textField.load()
        @textField.inputElement().val '   waffles    '
        @textField.inputChanged()
        @textField.value().should equal('waffles')
      
      it "should report change", ->
        @textField.load()
        @textField.shouldReceive '_valueChanged'
        @textField.inputElement().val '   waffles    '
        @textField.inputChanged()
    
    describe "#inputFocus", ->
      it "should remove placeholder", ->
        @textField.placeholder 'banana'
        @textField.load()
        @textField.inputFocus()
        @textField.inputElement().val().should equal('')
    
    describe "#inputBlur", ->
      it "should display placeholder", ->
        @textField.placeholder 'banana'
        @textField.load()
        @textField.inputElement().val ''
        @textField.inputBlur()
        @textField.inputElement().val().should equal('banana')
    
    describe "#_placeholderChanged", ->
      it "should update placeholder text", ->
        @textField.placeholder 'banana'
        @textField.load()
        @textField.placeholder 'waffles'
        @textField.inputElement().val().should equal('waffles')