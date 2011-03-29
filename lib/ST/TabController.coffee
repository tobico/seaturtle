#require ST/Controller

ST.class 'TabController', 'Controller', ->
  @initializer ->
    @super()
    @_view = ST.View.create()
    
    @_tabView = ST.TabView.create()
    @_tabView.bind 'switchedTab', this, 'tabViewSwitchedTab'
    @_tabView.setCanClose @methodFn('canCloseTab')
    @_tabView.bind 'closedTab', this, 'tabViewClosedTab'
    @_view.addChild @_tabView
    
    @_contentView = ST.View.create()
    @_view.addChild @contentView
    
    @_tabControllers = ST.List.create()
    @_activeTab = null
    @_hideSingleTab = false
  
  @property 'activeTab'
  @property 'hideSingleTab'
  @retainedProperty 'tabView'
  
  @destructor ->
    @_tabView.unbindAll this
    @super()
  
  @method 'setActiveTab', (newTab) ->
    if @_activeTab
      @_activeTab.view.trigger 'hiding'
      @_contentView.removeChild @_activeTab.view
      @_activeTab.view.trigger 'hid'
    
    return unless @_tabControllers.has newTab
    $.scrollTo 0,0
    
    @_activeTab = newTab
    
    @_activeTab.view.trigger 'showing'
    @_contentView.addChild @_activeTab.view
    @_activeTab.view.trigger 'showed'
  
  @method 'viewLoaded', (view) ->
    @updateTabView()
    if @_tabControllers.count()
      @activeTab @_tabControllers.first()
  
  @method 'canCloseTab', (tab, index) ->
    controller = @_tabControllers.objectAtIndex index
    !!(controller && controller.closedTab)

  @method 'tabViewClosedTab', (tabView, tab, index) ->
    controller = @_tabControllers.objectAtIndex index
    if controller && controller.closedTab
      controller.closedTab()
  
  @method 'tabViewSwitchedTab', (tabView, oldIndex, newIndex) ->
    @activeTab @_tabControllers.objectAtIndex(newIndex)
  
  @method 'updateTabView', ->
    self = this
    
    return unless @view.loaded()
    
    if @hideSingleTab && @tabControllers.count() <= 1
      @tabView.unload() if @tabView.loaded()
    else
      @tabView.load() unless @tabView.loaded()
      
      tabs = []
      @_tabControllers.each (controller) ->
        tabs.push self.tabForController(controller)
      @tabView.tabs tabs
    
    @tabView.activeTab(
      Math.max(@_tabControllers.indexOfObject(@_activeTab), 0)
    )
  
  @method 'tabForController', (controller) ->
    controller.tabTitle || ''
  
  @method 'emptyTabs', ->
    if @_activeTab
      @_view.removeChild @_activeTab.view()
      @_activeTab = null
    @_tabControllers.empty()
  
  @method 'addTab', (tab) ->
    tc = this
    
    tab.setTabTitle = (tabTitle) ->
      @_tabTitle = tabTitle
      tc.updateTabView()
    
    if !@_tabControllers.count() && @view.loaded
      @_activeTab tab
    
    @_tabControllers.add tab
    @_updateTabView()
  
  @method 'addAndReleaseTab', (tab) ->
    @_addTab tab
    tab.release()
  
  @method 'insertTabAtIndex', (tab, index) ->
    tc = this
    
    tab.setTabTitle = (tabTitle) ->
      @_tabTitle = tabTitle
      tc.updateTabView()
    
    @_tabControllers.insertAt index, tab
    
    @updateTabView()
  
  @method 'insertTabBefore', (tab, before) ->
    if before && before.index != null
      @_insertTabAtIndex tab, before.index
  
  @method 'insertTabAfter', (tab, after) ->
    if after && after.index >= 0 && after.index < @_tabControllers.count() - 1
      @_insertTabAtIndex tab, after.index + 1
    else
      @_addTab tab
  
  @method 'removeTab', (tab) ->
    if @_activeTab == tab
      @activeTab tab.next || tab.prev || null
    @_tabControllers.remove tab
    @_updateTabView()
  
  @method 'unloadTabs', ->
    self = this
    activeTab = @_activeTab
    @activeTab null
    @_tabControllers.each (controller) ->
      controller.view.unload()
    @activeTab activeTab