/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/ButtonBarView

$.fx.off = true;

Spec.describe('ButtonBarView', function() {
  beforeEach(function() {
    return this.view = ST.ButtonBarView.create();
  });
  
  describe("#init", () =>
    it("should set defaults", function() {
      return this.view._buttons.should(equal([]));
    })
  );
  
  describe("#button", () =>
    it("should add a button definition", function() {
      const fn = () => null;
      this.view.button('test', fn);
      this.view._buttons.length.should(equal(1));
      this.view._buttons[0].title.should(equal('test'));
      this.view._buttons[0].action.should(be(fn));
      return this.view._buttons[0].alternatives.should(equal([]));
    })
  );
  
  describe("#alternative", () =>
    it("should add an alternative to last button", function() {
      this.view.button('phony', () => null);
      this.view.button('primary', () => null);
      const fn = () => null;
      this.view.alternative('secondary', fn);
      this.view._buttons[1].alternatives.length.should(equal(1));
      this.view._buttons[1].alternatives[0].title.should(equal('secondary'));
      return this.view._buttons[1].alternatives[0].action.should(be(fn));
    })
  );
  
  return describe("#render", function() {
    it("should render a simple button", function() {
      this.view.button('test', () => null);
      this.view.render();
      return this.view.element().should(haveHtml('<a href="javascript:;" class="button simple_button" data-index="0">test</a>'));
    });
    
    it("should bind action to a simple button", function() {
      const clicked = expectation('click event fired');
      this.view.button('test', () => clicked.meet());
      this.view.render();
      return $('a', this.view.element()).click();
    });
    
    return it("should render a button with alternatives", function() {
      this.view.button('test', () => null);
      this.view.alternative('foo', () => null);
      this.view.render();
      return this.view.element().should(haveHtml('<span class="alt_button"><a href="javascript:;" class="button alt_button_main" data-index="0">test</a><a href="javascript:;" class="button alt_button_more" data-index="0"><span class="dropdown">V</span></a></span>'));
    });
  });
});