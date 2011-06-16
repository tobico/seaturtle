#require ST/TabView

Spec.describe "TabView", ->
  describe "#initializer", ->
    it "should create a UL element", ->
      view = ST.TabView.create()
      view.element().is('ul').should beTrue
    
    it "should set initial values for instance variables", ->
      view = ST.TabView.create()
      view._tabs.should equal([])
      view._tabIndex.should equal(0)
      view._truncateLength.should beFalse
      expect(view._canClose).to be(null)

context "with a new tab view", ->
  beforeEach ->
    @view = ST.TabView.create()
    @sandbox.append @view.element()
  
  describe "#render", ->
    it "should render one tab", ->
      @view.tabs ['Test']
      @view.load()
      @view.element().should haveHtml('<li class="hl"><span class="title active_title">Test</span></li>')
    
    it "should render two tabs, first active by default", ->
      @view.tabs ['Active', 'Inactive']
      @view.load()
      @view.element().should haveHtml('<li class="hl"><span class="title active_title">Active</span></li><li><span class="title inactive_title">Inactive</span></li>')
    
    it "should render two tabs, second set as active", ->
      @view.tabs ['Inactive', 'Active']
      @view.tabIndex 1
      @view.load()
      @view.element().should haveHtml('<li><span class="title inactive_title">Inactive</span></li><li class="hl"><span class="title active_title">Active</span></li>')
    
    it "should switch tabs when inactive tab mousedown", ->
      @view.tabs ['Active', 'Inactive']
      @view.load()
      @view.shouldReceive('switchToTab').with(1)
      $('span.inactive_title', @view.element()).mousedown()
  
  describe "#setTabs", ->
    it "should update tabs", ->
      @view.tabs ['Test']
      @view.load()
      @view.tabs ['Waffles']
      @view.element().should haveHtml('<li class="hl"><span class="title active_title">Waffles</span></li>')