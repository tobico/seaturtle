/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/EnumFieldView

Spec.describe('EnumFieldView', function() {
  beforeEach(function() {
    return this.enumField = ST.EnumFieldView.createWithValuesNull([['Bacon', 'bacon'], ['Waffles', 'waffles']], true);
  });
  
  describe("initializer", function() {
    it("should set defaults", function() {
      expect(this.enumField._value).to(be(null));
      expect(this.enumField._valueIndex).to(equal({}));
      expect(this.enumField._selectElement).to(be(null));
      return expect(this.enumField._id).to(be(null));
    });
    
    return it("should set values", function() {
      return expect(this.enumField._values).to(equal([['Bacon', 'bacon'], ['Waffles', 'waffles']]));
    });
  });
  
  describe("#isValueValid", function() {
    it("should be false when null and not allowed", function() {
      this.enumField.allowNull(false);
      return this.enumField.isValueValid(null).should(beFalse);
    });
    
    it("should be true when null and allowed", function() {
      return this.enumField.isValueValid(null).should(beTrue);
    });
    
    it("should be true when value is in values", function() {
      return this.enumField.isValueValid('bacon').should(beTrue);
    });
  
    return it("should be false when value is not in values", function() {
      return this.enumField.isValueValid('avacado').should(beFalse);
    });
  });
  
  describe("#render", function() {
    it("should create select element", function() {
      this.enumField.render();
      return this.enumField.selectElement().shouldNot(be(null));
    });
    
    it("should set ID for select element", function() {
      this.enumField.id('foo');
      this.enumField.render();
      return this.enumField.selectElement().attr('id').should(equal('foo'));
    });
    
    return it("should render options", function() {
      this.enumField.shouldReceive('renderOptions');
      return this.enumField.render();
    });
  });
  
  describe("#renderOptions", function() {
    it("should render options", function() {
      this.enumField.load();
      return this.enumField.selectElement().should(haveHtml('<option value="" selected="selected"></option><option value="bacon">Bacon</option><option value="waffles">Waffles</option>'));
    });
    
    return it("should mark value as selected", function() {
      this.enumField.value('bacon');
      this.enumField.load();
      return this.enumField.selectElement().should(haveHtml('<option value=""></option><option value="bacon" selected="selected">Bacon</option><option value="waffles">Waffles</option>'));
    });
  });
  
  describe("#selectChanged", function() {
    it("should trigger submit on enter key", function() {
      this.enumField.shouldReceive('trigger').with('submit');
      return this.enumField.selectChanged({which: 13});
  });
    
    it("should update value with value of select", function() {
      this.enumField.load();
      this.enumField.selectElement()[0].selectedIndex = 1;
      this.enumField.selectChanged();
      return this.enumField.value().should(equal('bacon'));
    });
          
    return it("should report change", function() {
      this.enumField.load();
      this.enumField.shouldReceive('setValue');
      this.enumField.selectElement()[0].selectedIndex = 1;
      return this.enumField.selectChanged();
    });
  });
  
  describe("#_setValue", () =>
    it("should update selected value", function() {
      this.enumField.load();
      this.enumField.value('waffles');
      return this.enumField.selectElement()[0].selectedIndex.should(equal(2));
    })
  );
  
  describe("#_valuesChanged", function() {
    it("should rerender options", function() {
      this.enumField.load();
      this.enumField.shouldReceive('renderOptions');
      return this.enumField.values(['Spam', 'spam']);
  });
    
    it("should set value to null if no longer valid", function() {
      this.enumField.value('bacon');
      this.enumField.values(['Spam', 'spam']);
      return expect(this.enumField.value()).to(be(null));
    });
    
    return it("should keep value if it's still valid", function() {
      this.enumField.value('waffles');
      this.enumField.values([['Waffles', 'waffles'], ['Pancakes', 'pancakes']]);
      return this.enumField.value().should(equal('waffles'));
    });
  });
  
  return describe("#_idChanged", () =>
    it("should update ID for input element", function() {
      this.enumField.id('foo');
      this.enumField.load();
      this.enumField.id('bar');
      return this.enumField.selectElement().attr('id').should(equal('bar'));
    })
  );
});