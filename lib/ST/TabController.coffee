ST.class 'TabController', 'ViewController', ->
  @constructor ->
    @_super()
    @view = ST.View.create()
    @view.setDelegate this
    
    @tabView = ST.TabView.create()
    @tabView.bind 'switchedTab', this, 'tabViewSwitchedTab'
    @tabView.setCanClose @methodFn('canCloseTab')
    @tabView.setTruncateLength @tabTruncateLength
    @tabView.bind 'closedTab', this, 'tabViewClosedTab'
    @view.addChild @tabView
    
    @contentView = ST.View.create()
    @view.addChild @contentView
    
    @tabControllers = ST.IndexedList.create()
    @activeTab = null
    @hideSingleTab = false
    @tabTruncateLength = false
  
  @property 'activeTab'
  @property 'tabView', 'retain', 'readonly'
  @property 'tabTruncateLength'
  @property 'hideSingleTab'
  
  @destructor ->
    @tabView.unbindAll this if @tabView
    @releaseMembers 'tabView', 'contentView', 'tabControllers'
    @_super()
  
  @method 'setActiveTab', (newTab) ->
    if @activeTab
      @activeTab.view.trigger 'hiding'
      @contentView.removeChild @activeTab.view
      @activeTab.view.trigger 'hid'
    
    return unless @tabControllers.has newTab
    $.scrollTo 0,0
    
    @activeTab = newTab
    
    @activeTab.view.trigger 'showing'
    @contentView.addChild @activeTab.view
    @activeTab.view.trigger 'showed'
  
  @method 'viewLoaded', (view) ->
    @updateTabView()
    if @tabControllers.count()
      @setActiveTab @tabControllers.first()
  
  @method 'canCloseTab', (tab, index) ->
    controller = @tabControllers.objectAtIndex index
    !!(controller && controller.closedTab)

  @method 'tabViewClosedTab', (tabView, tab, index) ->
    controller = @tabControllers.objectAtIndex index
    if controller && controller.closedTab
      controller.closedTab()
  
  @method 'tabViewSwitchedTab', (tabView, oldIndex, newIndex) ->
    @setActiveTab @tabControllers.objectAtIndex(newIndex)
  
  @method 'updateTabView', ->
    self = this;
    
    return unless @view.loaded
    
    if @hideSingleTab && @tabControllers.count() <= 1
      @tabView.unload() if @tabView.loaded
    else
      @tabView.load() unless @tabView.loaded
      
      tabs = []
      @tabControllers.each (controller) ->
        tabs.push self.tabForController(controller)
      @tabView.setTabs tabs
    
    @tabView.setActiveTab(
      Math.max(@tabControllers.indexOfObject(@activeTab), 0)
    )
  
  @method 'tabForController', (controller) ->
    controller.tabTitle || ''
  
  @method 'emptyTabs', ->
    if @activeTab
      @view.removeChild @activeTab.view
      @activeTab = null
    @tabControllers.empty()
  
  @method 'addTab', (tab) ->
    tc = this
    
    tab.setTabTitle = (tabTitle) ->
      @tabTitle = tabTitle
      tc.updateTabView()
    
    if !@tabControllers.count() && @view.loaded
      @setActiveTab tab
    
    @tabControllers.add tab
    @updateTabView()
  
  @method 'addAndReleaseTab', (tab) ->
    @addTab tab
    tab.release()
  
  @method 'insertTabAtIndex', (tab, index) ->
    tc = this
    
    tab.setTabTitle = (tabTitle) ->
      @tabTitle = tabTitle
      tc.updateTabView()
    
    @tabControllers.insertAt index, tab
    
    this.updateTabView();
  
  @method 'insertTabBefore', (tab, before) ->
    if before && before.index != null
      @insertTabAtIndex tab, before.index
  
  @method 'insertTabAfter', (tab, after) ->
    if after && after.index >= 0 && after.index < (this.tabControllers.count() - 1)
      @insertTabAtIndex tab, after.index + 1
    else
      @addTab tab
  
  @method 'removeTab', (tab) ->
    if @activeTab == tab
      @setActiveTab tab.next || tab.prev || null
    @tabControllers.remove tab
    @updateTabView()
  
  @method 'unloadTabs', ->
    self = this;
    activeTab = @activeTab
    @setActiveTab null
    @tabControllers.each (controller) ->
      controller.view.unload()
    @setActiveTab activeTab