#require ST/TabController

$ ->
  Spec.describe 'TabController', ->
    beforeEach ->
      @tabController = ST.TabController.create()
    
    describe "#initialize", ->
      it "should create view", ->
        @tabController.view().should beAnInstanceOf(ST.View)
      
      it "should create tabs list", ->
        @tabController.tabs().should beAnInstanceOf(ST.List)
      
      it "should set defaults", ->
        expect(@tabController._activeTab).to be(null)
        @tabController._hideSingleTab.should beFalse
    
    describe "#destructor", ->
      it "should empty tabs", ->
        @tabController.tabs().shouldReceive 'empty'
        @tabController.destroy()
      
      it "should unbind tabs", ->
        @tabController.tabs().shouldReceive 'unbindAll'
        @tabController.destroy()
    
    describe "#viewLoaded", ->
      it "should create tab view", ->
        @tabController.view().load()
        @tabController.tabView().should beAnInstanceOf(ST.TabView)
      
      it "should update tab view", ->
        @tabController.shouldReceive 'updateTabView'
        @tabController.view().load()
      
      it "should activate first tab", ->
        tab = ST.TabController.create()
        @tabController.tabs().add tab
        @tabController.view().load()
        @tabController.activeTab().should be(tab)
    
    describe "#viewSwitchedTab", ->
      it "should activate new tab", ->
        tab1 = ST.TabController.create()
        @tabController.tabs().add tab1
        tab2 = ST.TabController.create()
        @tabController.tabs().add tab2
        @tabController.viewSwitchedTab @tabController.view(), 0, 1
        @tabController.activeTab().should be(tab2)
        @tabController.viewSwitchedTab @tabController.view(), 1, 0
        @tabController.activeTab().should be(tab1)
    
    describe "#updateTabView", ->
      it "should hide tab view for single tab", ->
        @tabController.view().load()
        @tabController.hideSingleTab true
        tab = ST.TabController.create()
        @tabController.tabs().add tab
        @tabController.tabView().shouldReceive 'hide'
        @tabController.updateTabView()
      
      it "should show single tab", ->
        tab = ST.TabController.create()
        tab.tabTitle = -> 'Test'
        @tabController.tabs().add tab
        @tabController.view().load()
        @tabController.tabView().element().html().should equal('<li class="hl"><span class="title active_title">Test</span></li>')
      
      it "should show multiple tabs", ->
        tab1 = ST.TabController.create()
        tab1.tabTitle = -> 'Foo'
        @tabController.tabs().add tab1
        tab2 = ST.TabController.create()
        tab2.tabTitle = -> 'Bar'
        @tabController.tabs().add tab2
        @tabController.view().load()
        @tabController.activeTab tab2
        @tabController.tabView().element().html().should equal('<li><span class="title inactive_title">Foo</span></li><li class="hl"><span class="title active_title">Bar</span></li>')
    
    describe "#tabAdded", ->
      it "should set as active tab if only item", ->
        tab = ST.TabController.create()
        @tabController.tabs().add tab
        @tabController.activeTab().should be(tab)
    
    describe "#tabRemoved", ->
      it "should set active tab to next tab", ->
        tab1 = ST.TabController.create()
        @tabController.tabs().add tab1
        tab2 = ST.TabController.create()
        @tabController.tabs().add tab2
        @tabController.activeTab tab1
        @tabController.tabs().remove tab1
        @tabController.activeTab().should be(tab2)
      
      it "should set active tab to previous tab if there is no next tab", ->
        tab1 = ST.TabController.create()
        @tabController.tabs().add tab1
        tab2 = ST.TabController.create()
        @tabController.tabs().add tab2
        @tabController.activeTab tab2
        @tabController.tabs().remove tab2
        @tabController.activeTab().should be(tab1)
      
      it "should set active tab to null if no tabs", ->
        tab = ST.TabController.create()
        @tabController.tabs().add tab
        @tabController.tabs().remove tab
        expect(@tabController.activeTab()).to be(null)
    
    describe "#tabChanged", ->
      it "should update tab view when tab title changed", ->
        ST.class 'TestController', 'TabController', ->
          @property 'tabTitle'
        tab = ST.TestController.create()
        @tabController.tabs().add tab
        @tabController.shouldReceive 'updateTabView'
        tab.tabTitle 'Waffles'
    
    describe "#_activeTabChanged", ->
      it "should update tab view", ->
        tab = ST.TabController.create()
        @tabController.tabs().add tab
        @tabController.shouldReceive 'updateTabView'
        @tabController.tabs().removeAt 0
      
      it "should add active tab's view as child", ->
        tab = ST.Controller.create()
        view = ST.View.create()
        view.load()
        tab._view = view
        @tabController.tabs().add tab
        @tabController.view().children().first().should be(view)
      
      it "should remove child view for old active tab", ->
        tab = ST.Controller.create()
        view = ST.View.create()
        tab._view = view
        @tabController.tabs().add tab
        @tabController.activeTab null
        @tabController.view().children().count().should equal(0)