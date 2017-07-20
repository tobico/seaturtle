import { TabController } from './tab-controller'
import { BaseView } from '../view/base-view'
import { List } from '../core/list'
import { TabView } from '../view/tab-view'
import { BaseController } from './base-controller'
import { makeClass } from '../core/make-class'

describe('TabController', function() {
  let tabController

  beforeEach(function() {
    tabController = TabController.create()
  })
  
  describe("#initialize", function() {
    it("should create view", function() {
      expect(tabController.view()).toBeInstanceOf(BaseView)
    })
    
    it("should create tabs list", function() {
      expect(tabController.tabs()).toBeInstanceOf(List)
    })
    
    it("should set defaults", function() {
      expect(tabController._activeTab).toBe(null)
      expect(tabController._hideSingleTab).toBe(false)
    })
  })
  
  describe("#destructor", function() {
    it("should empty tabs", function() {
      let empty = jest.fn()
      tabController.tabs().empty = empty
      tabController.destroy()
      expect(empty).toBeCalled()
    })
    
    it("should unbind tabs", function() {
      let unbindAll = jest.fn()
      tabController.tabs().unbindAll = unbindAll
      tabController.destroy()
      expect(unbindAll).toBeCalled()
    })
  })
  
  describe("#viewLoaded", function() {
    it("should create tab view", function() {
      tabController.view().load()
      expect(tabController.tabView()).toBeInstanceOf(TabView)
    })
    
    it("should update tab view", function() {
      tabController.updateTabView = jest.fn()
      tabController.view().load()
      expect(tabController.updateTabView).toBeCalled()
    })
    
    it("should activate first tab", function() {
      const tab = TabController.create()
      tabController.tabs().add(tab)
      tabController.view().load()
      expect(tabController.activeTab()).toBe(tab)
    })
  })
  
  describe("#viewSwitchedTab", () =>
    it("should activate new tab", function() {
      const tab1 = TabController.create()
      tabController.tabs().add(tab1)
      const tab2 = TabController.create()
      tabController.tabs().add(tab2)
      tabController.viewSwitchedTab(tabController.view(), 0, 1)
      expect(tabController.activeTab()).toBe(tab2)
      tabController.viewSwitchedTab(tabController.view(), 1, 0)
      expect(tabController.activeTab()).toBe(tab1)
    })
  )
  
  describe("#updateTabView", function() {
    it("should hide tab view for single tab", function() {
      tabController.view().load()
      tabController.hideSingleTab(true)
      const tab = TabController.create()
      tabController.tabs().add(tab)
      const hide = jest.fn()
      tabController.tabView().hide = hide
      tabController.updateTabView()
      expect(hide).toBeCalled()
    })
    
    it("should show single tab", function() {
      const tab = TabController.create()
      tab.tabTitle = () => 'Test'
      tabController.tabs().add(tab)
      tabController.view().load()
      expect(tabController.tabView().element().html()).toEqual('<li class="hl"><span class="title active_title">Test</span></li>')
    })
    
    it("should show multiple tabs", function() {
      const tab1 = TabController.create()
      tab1.tabTitle = () => 'Foo'
      tabController.tabs().add(tab1)
      const tab2 = TabController.create()
      tab2.tabTitle = () => 'Bar'
      tabController.tabs().add(tab2)
      tabController.view().load()
      tabController.activeTab(tab2)
      expect(tabController.tabView().element().html()).toEqual('<li><span class="title inactive_title">Foo</span></li><li class="hl"><span class="title active_title">Bar</span></li>')
    })
  })
  
  describe("#tabAdded", () =>
    it("should set as active tab if only item", function() {
      const tab = TabController.create()
      tabController.tabs().add(tab)
      expect(tabController.activeTab()).toBe(tab)
    })
  )
  
  describe("#tabRemoved", function() {
    it("should set active tab to next tab", function() {
      const tab1 = TabController.create()
      tabController.tabs().add(tab1)
      const tab2 = TabController.create()
      tabController.tabs().add(tab2)
      tabController.activeTab(tab1)
      tabController.tabs().remove(tab1)
      expect(tabController.activeTab()).toBe(tab2)
    })
    
    it("should set active tab to previous tab if there is no next tab", function() {
      const tab1 = TabController.create()
      tabController.tabs().add(tab1)
      const tab2 = TabController.create()
      tabController.tabs().add(tab2)
      tabController.activeTab(tab2)
      tabController.tabs().remove(tab2)
      expect(tabController.activeTab()).toBe(tab1)
    })
    
    it("should set active tab to null if no tabs", function() {
      const tab = TabController.create()
      tabController.tabs().add(tab)
      tabController.tabs().remove(tab)
      expect(tabController.activeTab()).toBe(null)
    })
  })
  
  describe("#tabChanged", () => {
    let TestController

    beforeEach(() => {
      TestController = makeClass('TestController', TabController, (def) => {
        def.property('tabTitle')
      })
    })

    it("should update tab view when tab title changed", function() {
      const tab = TestController.create()
      tabController.tabs().add(tab)
      tabController.updateTabView = jest.fn()
      tab.tabTitle('Waffles')
      expect(tabController.updateTabView).toBeCalled()
    })
  })
  
  describe("#_activeTabChanged", function() {
    it("should update tab view", function() {
      const tab = TabController.create()
      tabController.tabs().add(tab)
      tabController.updateTabView = jest.fn()
      tabController.tabs().removeAt(0)
      expect(tabController.updateTabView).toBeCalled()
    })
    
    it("should add active tab's view as child", function() {
      const tab = BaseController.create()
      const view = BaseView.create()
      view.load()
      tab._view = view
      tabController.tabs().add(tab)
      expect(tabController.view().children().first()).toBe(view)
    })
    
    it("should remove child view for old active tab", function() {
      const tab = BaseController.create()
      const view = BaseView.create()
      tab._view = view
      tabController.tabs().add(tab)
      tabController.activeTab(null)
      expect(tabController.view().children().count()).toEqual(0)
    })
  })
})
