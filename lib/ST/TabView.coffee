#= require ST/View

ST.class 'TabView', 'View', ->
  @initializer ->
    @initWithElement @helper().tag('ul').addClass('tabs')
    @_tabs = []
    @_tabIndex = 0
    @_truncateLength = false
    @_canClose = null
  
  @property 'tabs'
  @property 'tabIndex'
  @property 'truncateLength'
  @property 'canClose'
  
  @method 'render', ->
    self = this
    @element().empty()
    
    for tab, index in @_tabs
      li = @helper().tag 'li'
      
      title = tab
      title = @helper.truncate title, @_truncateLength if @_truncateLength
      title = String(title)
      
      if index == @_tabIndex
        li.append '<span class="title active_title">' + title + '</span>'
        li.addClass 'hl'
      else
        li.append($('<span class="title inactive_title">' + title + '</span>').bind((if ST.touch() then 'touchstart' else 'mousedown'), do (index) -> ->
          self.switchToTab index
          closePopup() if window.closePopup
        ))
      
      @_canClose = @_canClose tab, index if typeof @_canClose == 'function'
      @helper().linkTag('X', -> self.closeTab index).addClass('close').appendTo(li) if @_canClose
      
      @element().append li
    
  @method 'closeTab', (index) ->
    tab = @_tabs[index]
    @_tabs.splice index, 1
    @trigger 'closedTab', tab, index
    @render()
    
  @method 'setTabs', (newTabs) ->
    @_tabs = newTabs
    @render() if @_loaded
  
  @method 'setTabIndex', (index) ->
    @_tabIndex = index
    @render() if @_loaded
  
  @method 'switchToTab', (index) ->
    oldIndex = @_tabIndex
    @tabIndex index
    @trigger 'switchedTab', oldIndex, index