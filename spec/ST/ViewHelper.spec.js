/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/ViewHelper

Spec.describe("ViewHelper", function() {
  beforeEach(function() {
    return this.helper = ST.ViewHelper.instance();
  });
  
  it("should be a singleton", function() {
    return ST.ViewHelper.instance().should(be(this.helper));
  });
  
  describe("#tag", function() {
    it("should create a jQuery object", function() {
      const tag = this.helper.tag('span');
      return tag.should(beAnInstanceOf(jQuery));
    });
      
    return it("should have the specified type", function() {
      const tag = this.helper.tag('span');
      return tag[0].tagName.should(equal('SPAN'));
    });
  });
  
  describe("#linkTag", function() {
    it("should create an A tag", function() {
      const tag = this.helper.linkTag('Test', () => null);
      return tag[0].tagName.should(equal('A'));
    });
    
    it("should have the specified text", function() {
      const tag = this.helper.linkTag('Test', () => null);
      return tag.html().should(equal('Test'));
    });
    
    return it("should call the supplied callback when link clicked", function() {
      const called = expectation('to call callback');
      const tag = this.helper.linkTag('Test', () => called.meet());
      return tag.click();
    });
  });
  
  describe("#truncate", function() {
    it("should pass through short text", function() {
      return this.helper.truncate('bananas', 10).should(equal('bananas'));
    });
    
    return it("should truncate long text", function() {
      return this.helper.truncate('bananas and pears', 10).should(equal('bananas...'));
    });
  });
  
  return describe("#printHTML", () => it("can't be tested"));
});