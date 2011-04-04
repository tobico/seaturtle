#require ST/Controller
#require ST/TabView

ST.class 'TabController', 'Controller', ->
  @initializer ->
    @super()
    
    view = ST.TabView.create()
    @view view
    view.bind 'switchedTab', this, 'viewSwitchedTab'
    view.release()
    
    @_tabs = ST.List.create()
    @_tabs.bind 'itemAdded',   this, 'tabAdded'
    @_tabs.bind 'itemChanged', this, 'tabChanged'
    @_tabs.bind 'itemRemoved', this, 'tabRemoved'
    @_activeTab = null
    @_hideSingleTab = false
  
  @property 'tabs'
  @property 'activeTab'
  @property 'hideSingleTab'
  
  @destructor ->
    @_tabs.empty()
    @_tabs.unbindAll this
    @super()
  
  @method 'viewLoaded', (view) ->
    @updateTabView()
    @activeTab @_tabs.first()
  
  @method 'viewSwitchedTab', (view, oldIndex, newIndex) ->
    @activeTab @_tabs.at(newIndex)
  
  @method 'updateTabView', ->
    if @_view.loaded()
      if @_hideSingleTab && @_tabs.count() == 1
        @_view.hide()
      else
        @_view.show()
        @_view.tabs @_tabs.mapArray((tab) -> if tab.tabTitle then tab.tabTitle() else 'Untitled')
        @_view.tabIndex Math.max(@_tabs.indexOf(@_activeTab), 0)
  
  @method 'tabAdded', (tabs, tab) ->
    @activeTab tab if tabs.count() == 1
    @updateTabView()
  
  @method 'tabRemoved', (tabs, tab, index) ->
    @activeTab tabs.at(index) || tabs.at(index - 1) || null
    @updateTabView()

  @method 'tabChanged', (tabs, tab, attribute, oldValue, newValue) ->
    @updateTabView() if attribute == 'tabTitle'
  
  @method '_activeTabChanged', (oldTab, newTab) ->
    if newTab
      @_view.footer newTab.view()
    else
      @_view.footer null