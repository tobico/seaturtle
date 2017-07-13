/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/TabController

Spec.describe('TabController', function() {
  beforeEach(function() {
    return this.tabController = ST.TabController.create();
  });
  
  describe("#initialize", function() {
    it("should create view", function() {
      return this.tabController.view().should(beAnInstanceOf(ST.View));
    });
    
    it("should create tabs list", function() {
      return this.tabController.tabs().should(beAnInstanceOf(ST.List));
    });
    
    return it("should set defaults", function() {
      expect(this.tabController._activeTab).to(be(null));
      return this.tabController._hideSingleTab.should(beFalse);
    });
  });
  
  describe("#destructor", function() {
    it("should empty tabs", function() {
      this.tabController.tabs().shouldReceive('empty');
      return this.tabController.destroy();
    });
    
    return it("should unbind tabs", function() {
      this.tabController.tabs().shouldReceive('unbindAll');
      return this.tabController.destroy();
    });
  });
  
  describe("#viewLoaded", function() {
    it("should create tab view", function() {
      this.tabController.view().load();
      return this.tabController.tabView().should(beAnInstanceOf(ST.TabView));
    });
    
    it("should update tab view", function() {
      this.tabController.shouldReceive('updateTabView');
      return this.tabController.view().load();
    });
    
    return it("should activate first tab", function() {
      const tab = ST.TabController.create();
      this.tabController.tabs().add(tab);
      this.tabController.view().load();
      return this.tabController.activeTab().should(be(tab));
    });
  });
  
  describe("#viewSwitchedTab", () =>
    it("should activate new tab", function() {
      const tab1 = ST.TabController.create();
      this.tabController.tabs().add(tab1);
      const tab2 = ST.TabController.create();
      this.tabController.tabs().add(tab2);
      this.tabController.viewSwitchedTab(this.tabController.view(), 0, 1);
      this.tabController.activeTab().should(be(tab2));
      this.tabController.viewSwitchedTab(this.tabController.view(), 1, 0);
      return this.tabController.activeTab().should(be(tab1));
    })
  );
  
  describe("#updateTabView", function() {
    it("should hide tab view for single tab", function() {
      this.tabController.view().load();
      this.tabController.hideSingleTab(true);
      const tab = ST.TabController.create();
      this.tabController.tabs().add(tab);
      this.tabController.tabView().shouldReceive('hide');
      return this.tabController.updateTabView();
    });
    
    it("should show single tab", function() {
      const tab = ST.TabController.create();
      tab.tabTitle = () => 'Test';
      this.tabController.tabs().add(tab);
      this.tabController.view().load();
      return this.tabController.tabView().element().should(haveHtml('<li class="hl"><span class="title active_title">Test</span></li>'));
    });
    
    return it("should show multiple tabs", function() {
      const tab1 = ST.TabController.create();
      tab1.tabTitle = () => 'Foo';
      this.tabController.tabs().add(tab1);
      const tab2 = ST.TabController.create();
      tab2.tabTitle = () => 'Bar';
      this.tabController.tabs().add(tab2);
      this.tabController.view().load();
      this.tabController.activeTab(tab2);
      return this.tabController.tabView().element().should(haveHtml('<li><span class="title inactive_title">Foo</span></li><li class="hl"><span class="title active_title">Bar</span></li>'));
    });
  });
  
  describe("#tabAdded", () =>
    it("should set as active tab if only item", function() {
      const tab = ST.TabController.create();
      this.tabController.tabs().add(tab);
      return this.tabController.activeTab().should(be(tab));
    })
  );
  
  describe("#tabRemoved", function() {
    it("should set active tab to next tab", function() {
      const tab1 = ST.TabController.create();
      this.tabController.tabs().add(tab1);
      const tab2 = ST.TabController.create();
      this.tabController.tabs().add(tab2);
      this.tabController.activeTab(tab1);
      this.tabController.tabs().remove(tab1);
      return this.tabController.activeTab().should(be(tab2));
    });
    
    it("should set active tab to previous tab if there is no next tab", function() {
      const tab1 = ST.TabController.create();
      this.tabController.tabs().add(tab1);
      const tab2 = ST.TabController.create();
      this.tabController.tabs().add(tab2);
      this.tabController.activeTab(tab2);
      this.tabController.tabs().remove(tab2);
      return this.tabController.activeTab().should(be(tab1));
    });
    
    return it("should set active tab to null if no tabs", function() {
      const tab = ST.TabController.create();
      this.tabController.tabs().add(tab);
      this.tabController.tabs().remove(tab);
      return expect(this.tabController.activeTab()).to(be(null));
    });
  });
  
  describe("#tabChanged", () =>
    it("should update tab view when tab title changed", function() {
      ST.class('TestController', 'TabController', function() {
        return this.property('tabTitle');
      });
      const tab = ST.TestController.create();
      this.tabController.tabs().add(tab);
      this.tabController.shouldReceive('updateTabView');
      return tab.tabTitle('Waffles');
    })
  );
  
  return describe("#_activeTabChanged", function() {
    it("should update tab view", function() {
      const tab = ST.TabController.create();
      this.tabController.tabs().add(tab);
      this.tabController.shouldReceive('updateTabView');
      return this.tabController.tabs().removeAt(0);
    });
    
    it("should add active tab's view as child", function() {
      const tab = ST.Controller.create();
      const view = ST.View.create();
      view.load();
      tab._view = view;
      this.tabController.tabs().add(tab);
      return this.tabController.view().children().first().should(be(view));
    });
    
    return it("should remove child view for old active tab", function() {
      const tab = ST.Controller.create();
      const view = ST.View.create();
      tab._view = view;
      this.tabController.tabs().add(tab);
      this.tabController.activeTab(null);
      return this.tabController.view().children().count().should(equal(0));
    });
  });
});