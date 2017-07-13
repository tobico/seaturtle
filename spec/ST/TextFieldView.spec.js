/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/TextFieldView

Spec.describe('TextFieldView', function() {
  beforeEach(function() {
    return this.textField = ST.TextFieldView.create();
  });
  
  describe("initializer", () =>
    it("should set defaults", function() {
      this.textField._value.should(equal(''));
      this.textField._autoTrim.should(beTrue);
      this.textField._placeholder.should(equal(''));
      return expect(this.textField._inputElement).to(be(null));
    })
  );
  
  describe("#setValue", function() {
    it("should set value", function() {
      this.textField.value('bacon');
      return this.textField._value.should(equal('bacon'));
    });
    
    it("should change input element value", function() {
      this.textField.load();
      this.textField.value('bacon');
      return this.textField.inputElement().val().should(equal('bacon'));
    });
    
    return it("should trigger _changed", function() {
      this.textField.shouldReceive('_changed');
      return this.textField.value('bacon');
    });
  });
  
  describe("#render", function() {
    it("should create input element", function() {
      this.textField.render();
      return this.textField.inputElement().shouldNot(be(null));
    });
    
    it("should set ID for input element", function() {
      this.textField.id('foo');
      this.textField.render();
      return this.textField.inputElement().attr('id').should(equal('foo'));
    });
    
    it("should put value into input element", function() {
      this.textField.value('bacon');
      this.textField.render();
      return this.textField.inputElement().val().should(equal('bacon'));
    });
    
    return it("should put placeholder into input element", function() {
      this.textField.placeholder('bacon');
      this.textField.render();
      return this.textField.inputElement().val().should(equal('bacon'));
    });
  });
  
  describe("#inputChanged", function() {
    it("should trigger submit on enter key", function() {
      this.textField.load();
      this.textField.shouldReceive('trigger').with('submit');
      return this.textField.keyDown({which: 13});
  });
    
    it("should update value with value of input", function() {
      this.textField.load();
      this.textField.inputElement().val('banana');
      this.textField.inputChanged();
      return this.textField.value().should(equal('banana'));
    });
    
    it("should autotrim value", function() {
      this.textField.load();
      this.textField.inputElement().val('   waffles    ');
      this.textField.inputChanged();
      return this.textField.value().should(equal('waffles'));
    });
    
    return it("should report change", function() {
      this.textField.load();
      this.textField.shouldReceive('_valueChanged');
      this.textField.inputElement().val('   waffles    ');
      return this.textField.inputChanged();
    });
  });
  
  describe("#inputFocus", () =>
    it("should remove placeholder", function() {
      this.textField.placeholder('banana');
      this.textField.load();
      this.textField.inputFocus();
      return this.textField.inputElement().val().should(equal(''));
    })
  );
  
  describe("#inputBlur", () =>
    it("should display placeholder", function() {
      this.textField.placeholder('banana');
      this.textField.load();
      this.textField.inputElement().val('');
      this.textField.inputBlur();
      return this.textField.inputElement().val().should(equal('banana'));
    })
  );
  
  describe("#_placeholderChanged", () =>
    it("should update placeholder text", function() {
      this.textField.placeholder('banana');
      this.textField.load();
      this.textField.placeholder('waffles');
      return this.textField.inputElement().val().should(equal('waffles'));
    })
  );
  
  return describe("#_idChanged", () =>
    it("should update ID for input element", function() {
      this.textField.id('foo');
      this.textField.load();
      this.textField.id('bar');
      return this.textField.inputElement().attr('id').should(equal('bar'));
    })
  );
});