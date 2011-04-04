#require ST/Model
#require ST/FormView
#require ST/TextFieldView
#require ST/EnumFieldView

$ ->
  Spec.describe "FormView", ->
    beforeEach ->
      ST.class 'Author', 'Model', ->
        @string 'name'
      @author = ST.Author.createWithData {name: 'Charles Dickens'}
      ST.class 'Book', 'Model', ->
        @string 'title'
        @enum 'format', 'paper', { hard: 'Hardcover', paper: 'Paperback', 'ebook': 'Electronic' }
        @belongsTo 'author', 'Author'
      @view = ST.FormView.createWithModelAttributes(ST.Book, ['title', 'author', 'format'])
    
    describe "#initWithModelAttributes", ->
      it "should set values", ->
        @view._model.should be(ST.Book)
        @view._attributes.should equal(['title', 'author', 'format'])
    
    describe "#render", ->
      it "should render a table", ->
        @view.render()
        $('table', @view.element()).length.should equal(1)
      
      it "should render field labels", ->
        @view.render()
        label = $ 'label', @view.element()
        label.length.should equal(3)
        label.eq(0).attr('for').should equal('title')
        label.eq(1).attr('for').should equal('author')
        label.eq(2).attr('for').should equal('format')
      
      it "should create TextFieldView for attribute", ->
        @view.render()
        @view._fields['title'].should beAnInstanceOf(ST.TextFieldView)
      
      it "should create EnumFieldView", ->
        @view.render()
        @view._fields['format'].should beAnInstanceOf(ST.EnumFieldView)
    
    describe "#data", ->
      it "should include value for text field", ->
        @view.load()
        @view._fields['title'].value 'Bacon Adventures'
        data = @view.data()
        data['title'].should equal('Bacon Adventures')
      
      it "should include value for model field", ->
        @view.load()
        @view._fields['author'].value @author
        data = @view.data()
        data['author'].should be(@author)