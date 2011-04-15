#require ST/Controller
#require ST/TabView

ST.class 'TabController', 'Controller', ->
  @initializer ->
    @super()
    view = ST.View.create()
    @view view
    view.release()
    @_tabs = ST.List.create()
    @_tabs.bind 'itemAdded',   this, 'tabAdded'
    @_tabs.bind 'itemChanged', this, 'tabChanged'
    @_tabs.bind 'itemRemoved', this, 'tabRemoved'
    @_tabView = null
    @_activeTab = null
    @_hideSingleTab = false
  
  @property 'tabs'
  @retainedProperty 'tabView'
  @property 'activeTab'
  @property 'hideSingleTab'
  
  @destructor ->
    @_tabs.empty()
    @_tabs.unbindAll this
    @super()
  
  @method 'viewLoaded', (view) ->
    tabView = ST.TabView.create()
    @tabView tabView
    @_view.addChild tabView
    tabView.bind 'switchedTab', this, 'viewSwitchedTab'
    tabView.release()
    @activeTab @_tabs.first()
  
  @method 'viewSwitchedTab', (view, oldIndex, newIndex) ->
    @activeTab @_tabs.at(newIndex)
  
  @method 'updateTabView', ->
    if @_tabView
      if @_hideSingleTab && @_tabs.count() == 1
        @_tabView.hide()
      else
        @_tabView.show()
        @_tabView.tabs @_tabs.mapArray((tab) -> if tab.tabTitle then tab.tabTitle() else 'Untitled')
        @_tabView.tabIndex Math.max(@_tabs.indexOf(@_activeTab), 0)
  
  @method 'tabAdded', (tabs, tab) ->
    if tabs.count() == 1
      @activeTab tab
    else
      @updateTabView()
  
  @method 'tabRemoved', (tabs, tab, index) ->
    if @_activeTab == tab
      @activeTab tabs.at(index) || tabs.at(index - 1) || null
    else
      @updateTabView()

  @method 'tabChanged', (tabs, tab, attribute, oldValue, newValue) ->
    @updateTabView() if attribute == 'tabTitle'
  
  @method '_activeTabChanged', (oldTab, newTab) ->
    self = this
    @updateTabView()
    oldView = oldTab && oldTab.view()
    newView = newTab && newTab.view()
    switchViews = ->
      self._view.removeChild oldView if oldView
      self._view.addChild newView if newView
    
    if newTab && !newTab.view().loaded()
      # Switch child views asynchronously, so that user gets response
      # instantly, even if the new view takes a while to load
      setTimeout switchViews, 1
    else
      switchViews()