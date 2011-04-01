#require ST/Model
#require ST/FormView

$ ->
  Spec.describe "FormView", ->
    beforeEach ->
      ST.class 'Book', 'Model', ->
        @string 'title'
      @view = ST.FormView.createWithModelAttributes(ST.Book, ['title'])
    
    describe "#initWithModelAttributes", ->
      it "should set values", ->
        @view._model.should be(ST.Book)
        @view._attributes.should equal(['title'])
    
    describe "#render", ->
      it "should render a table", ->
        @view.render()
        $('table', @view.element()).length.should equal(1)
      
      it "should render field labels", ->
        @view.render()
        label = $ 'label', @view.element()
        label.length.should equal(1)
        label.attr('for').should equal('title')
      
      it "should create TextFieldView for attribute", ->
        @view.render()
        @view.children().count().should equal(1)