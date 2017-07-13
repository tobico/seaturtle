/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Model
//= require ST/ModelFieldView

Spec.describe('ModelFieldView', function() {
  beforeEach(function() {
    ST.class('TestModel', ST.Model.Base, function() {
      this.string('title');
      this.searchesOn('title');
      this.method('toListItem', function() { return [this.title()]; });
      return this.method('toFieldText', function() { return this.title(); });
    });
    this.model = ST.TestModel;
    this.modelField = ST.ModelFieldView.createWithModel(this.model);
    return this.item = ST.TestModel.createWithData({title: 'test'});
  });

  describe("initializer", function() {
    it("should set model", function() {
      return this.modelField._model.should(be(this.model));
    });
    
    return it("should set defaults", function() {
      expect(this.modelField._value).to(be(null));
      expect(this.modelField._inputValue).to(be(null));
      this.modelField._searching.should(beFalse);
      this.modelField._searchValue.should(equal(''));
      expect(this.modelField._results).to(be(null));
      return this.modelField._canCreate.should(beFalse);
    });
  });
  
  describe("#initWithScope", function() {
    beforeEach(function() {
      this.field = new ST.ModelFieldView();
      return this.scope = ST.TestModel.where(ST.TestModel.title.equals('bananas'));
    });
    
    it("should call initWithModel", function() {
      this.field.shouldReceive('initWithModel').with(ST.TestModel);
      return this.field.initWithScope(this.scope);
    });
    
    return it("should set scope", function() {
      this.field.initWithScope(this.scope);
      return this.field._scope.should(be(this.scope));
    });
  });
  
  describe("#render", function() {
    it("should put current value in field", function() {
      this.modelField.value(this.item);
      this.modelField.render();
      return this.modelField.inputElement().val().should(equal('test'));
    });
    
    return it("should create result list element", function() {
      this.modelField.render();
      return this.modelField._resultListElement.should(beAnInstanceOf(jQuery));
    });
  });
  
  describe("#inputFocus", function() {
    it("should perform search when field has text", function() {
      this.modelField.load();
      this.modelField.inputElement().val('test');
      this.modelField.shouldReceive('performSearch');
      return this.modelField.inputFocus();
    });
    
    return it("should select all when field has a value", function() {
      this.modelField.render();
      this.modelField.inputElement().val('test');
      this.modelField.value(this.item);
      this.modelField.inputElement().shouldReceive('select');
      return this.modelField.inputFocus();
    });
  });
  
  describe("#inputBlur", function() {
    it("should set value to null when input empty", function() {
      this.modelField.render();
      this.modelField.value(this.item);
      this.modelField._focused = true;
      this.modelField.inputValue('');
      this.modelField.inputBlur();
      return expect(this.modelField.value()).to(be(null));
    });
    
    it("should choose selected result", function() {
      this.modelField.render();
      this.modelField.inputElement().val('test');
      this.modelField._results = [[this.item, 1]];
      this.modelField._selectedResult = 0;
      this.modelField.inputBlur();
      return this.modelField.value().should(be(this.item));
    });
    
    return it("should display current value if no result selected", function() {
      this.modelField.render();
      this.modelField.value(this.item);
      this.modelField.inputElement().val('testing');
      this.modelField.inputBlur();
      return this.modelField.inputElement().val().should(equal('test'));
    });
  });
  
  describe("#inputChanged", () =>
    it("should update inputValue", function() {
      this.modelField.render();
      this.modelField.inputElement().val('bacon');
      this.modelField.inputChanged();
      return this.modelField.inputValue().should(equal('bacon'));
    })
  );
  
  describe("#_inputValueChanged", () =>
    it("should perform serach", function() {
      this.modelField.load();
      this.modelField._focused = true;
      this.modelField.shouldReceive('performSearch');
      return this.modelField._inputValueChanged('bacon', 'waffles');
    })
  );
  
  describe("#_valueChanged", () =>
    it("should display value in field", function() {
      this.modelField.load();
      this.modelField.value(this.item);
      return this.modelField.inputValue().should(equal('test'));
    })
  );
  
  describe("#_selectedResultChanged", function() {
    it("should add 'selected' class to selected row");
    return it("should remove 'selected' class from unselected row");
  });
  
  describe("#inputKeyDown", function() {
    it("should go to previous result when I press up");
    it("should wrap around when I press up");
    it("should go to next result when I press down");
    it("should wrap around when I press down");
    it("should blur input when I press enter");
    it("should deselect result and blur input when I press escape");
    return it("should select corresponsing result when I press a number key");
  });
  
  describe("#performSearch", function() {
    it("should start search for keyword");
    return it("should hide results with blank keyword");
  });
  
  describe("#showResults", () => it("should display results"));
  
  return describe("#chooseResult", function() {
    it("should display toFieldText text in input");
    return it("should update value");
  });
});