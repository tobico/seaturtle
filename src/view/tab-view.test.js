import jQuery from 'jquery'

import { TabView } from './tab-view'

describe("TabView", () =>
  describe("#initializer", function() {
    it("should create a UL element", function() {
      const view = TabView.create()
      expect(view.element().is('ul')).toBe(true)
    })
    
    it("should set initial values for instance variables", function() {
      const view = TabView.create()
      expect(view._tabs).toEqual([])
      expect(view._tabIndex).toEqual(0)
      expect(view._truncateLength).toBe(false)
      expect(view._canClose).toBe(null)
    })
  })
)

describe("with a new tab view", function() {
  let view

  beforeEach(function() {
    view = TabView.create()
    //this.sandbox.append(view.element())
  })
  
  describe("#render", function() {
    it("should render one tab", function() {
      view.tabs(['Test'])
      view.load()
      expect(view.element().html()).toEqual('<li class="hl"><span class="title active_title">Test</span></li>')
    })
    
    it("should render two tabs, first active by default", function() {
      view.tabs(['Active', 'Inactive'])
      view.load()
      expect(view.element().html()).toEqual('<li class="hl"><span class="title active_title">Active</span></li><li><span class="title inactive_title">Inactive</span></li>')
    })
    
    it("should render two tabs, second set as active", function() {
      view.tabs(['Inactive', 'Active'])
      view.tabIndex(1)
      view.load()
      expect(view.element().html()).toEqual('<li><span class="title inactive_title">Inactive</span></li><li class="hl"><span class="title active_title">Active</span></li>')
    })
    
    it("should switch tabs when inactive tab mousedown", function() {
      view.tabs(['Active', 'Inactive'])
      view.load()
      const switchToTab = jest.spyOn(view, 'switchToTab')
      jQuery('span.inactive_title', view.element()).mousedown()
      expect(switchToTab).toBeCalledWith(1)
    })
  })
  
  describe("#setTabs", () =>
    it("should update tabs", function() {
      view.tabs(['Test'])
      view.load()
      view.tabs(['Waffles'])
      expect(view.element().html()).toEqual('<li class="hl"><span class="title active_title">Waffles</span></li>')
    })
  )
})
