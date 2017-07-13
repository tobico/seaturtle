/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/TabView

Spec.describe("TabView", () =>
  describe("#initializer", function() {
    it("should create a UL element", function() {
      const view = ST.TabView.create();
      return view.element().is('ul').should(beTrue);
    });
    
    return it("should set initial values for instance variables", function() {
      const view = ST.TabView.create();
      view._tabs.should(equal([]));
      view._tabIndex.should(equal(0));
      view._truncateLength.should(beFalse);
      return expect(view._canClose).to(be(null));
    });
  })
);

context("with a new tab view", function() {
  beforeEach(function() {
    this.view = ST.TabView.create();
    return this.sandbox.append(this.view.element());
  });
  
  describe("#render", function() {
    it("should render one tab", function() {
      this.view.tabs(['Test']);
      this.view.load();
      return this.view.element().should(haveHtml('<li class="hl"><span class="title active_title">Test</span></li>'));
    });
    
    it("should render two tabs, first active by default", function() {
      this.view.tabs(['Active', 'Inactive']);
      this.view.load();
      return this.view.element().should(haveHtml('<li class="hl"><span class="title active_title">Active</span></li><li><span class="title inactive_title">Inactive</span></li>'));
    });
    
    it("should render two tabs, second set as active", function() {
      this.view.tabs(['Inactive', 'Active']);
      this.view.tabIndex(1);
      this.view.load();
      return this.view.element().should(haveHtml('<li><span class="title inactive_title">Inactive</span></li><li class="hl"><span class="title active_title">Active</span></li>'));
    });
    
    return it("should switch tabs when inactive tab mousedown", function() {
      this.view.tabs(['Active', 'Inactive']);
      this.view.load();
      this.view.shouldReceive('switchToTab').with(1);
      return $('span.inactive_title', this.view.element()).mousedown();
    });
  });
  
  return describe("#setTabs", () =>
    it("should update tabs", function() {
      this.view.tabs(['Test']);
      this.view.load();
      this.view.tabs(['Waffles']);
      return this.view.element().should(haveHtml('<li class="hl"><span class="title active_title">Waffles</span></li>'));
    })
  );
});