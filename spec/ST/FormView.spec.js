/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Model
//= require ST/FormView
//= require ST/TextFieldView
//= require ST/EnumFieldView

Spec.describe("FormView", function() {
  beforeEach(function() {
    ST.class('Author', ST.Model.Base, function() {
      this.string('name');
      return this.method('toFieldText', function() { return this.name(); });
    });
    this.author = ST.Author.createWithData({name: 'Charles Dickens'});
    ST.class('Book', ST.Model.Base, function() {
      this.string('title');
      this.enum('format', 'paper', { hard: 'Hardcover', paper: 'Paperback', 'ebook': 'Electronic' });
      return this.belongsTo('author', 'Author');
    });
    return this.view = ST.FormView.createWithModelAttributes(ST.Book, ['title', 'author', 'format']);
  });
  
  describe("#initWithModelAttributes", () =>
    it("should set values", function() {
      this.view._model.should(be(ST.Book));
      return this.view._attributes.should(equal(['title', 'author', 'format']));
    })
  );
  
  describe("#render", function() {
    it("should render a table", function() {
      this.view.render();
      return $('table', this.view.element()).length.should(equal(1));
    });
    
    it("should render field labels", function() {
      this.view.render();
      const label = $('label', this.view.element());
      label.length.should(equal(3));
      label.eq(0).attr('for').should(equal('title'));
      label.eq(1).attr('for').should(equal('author'));
      return label.eq(2).attr('for').should(equal('format'));
    });
    
    it("should create TextFieldView for attribute", function() {
      this.view.render();
      return this.view._fields['title'].should(beAnInstanceOf(ST.TextFieldView));
    });
    
    return it("should create EnumFieldView", function() {
      this.view.render();
      return this.view._fields['format'].should(beAnInstanceOf(ST.EnumFieldView));
    });
  });
  
  return describe("#data", function() {
    it("should include value for text field", function() {
      this.view.load();
      this.view._fields['title'].value('Bacon Adventures');
      const data = this.view.data();
      return data['title'].should(equal('Bacon Adventures'));
    });
    
    return it("should include value for model field", function() {
      this.view.load();
      this.view._fields['author'].value(this.author);
      const data = this.view.data();
      return data['author'].should(be(this.author));
    });
  });
});