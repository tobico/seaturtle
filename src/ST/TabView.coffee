ST.class 'TabView', 'View', ->
  @constructor ->
    @_super()
    @tabs = []
    @activeTab = 0
    @truncateLength = false
    @canClose = false
  
  @property 'tabs'
  @property 'activeTab'
  @property 'truncateLength'
  @property 'canClose'
  
  @method 'render', (element) ->
    @_super element
    
    return unless @tabs.length
    
    self = this
    
    ul = $('<ul class="tabs"></ul>').appendTo(element)
    
    for index, tab in tabs
      li = $('<li></li>').appendTo(ul)
      
      title = tab      
      title = @helper.truncate title, @truncateLength if @truncateLength
      title = String(title)
      
      if index == @activeTab
        li.append '<span class="title active_title">' + title + '</span>'
        li.addClass 'hl'
      else
        li.append($('<span class="title inactive_title">' + title + '</span>').bind('touchstart mousedown', -> self.switchToTab index))
            
      @canClose = @canClose tab, index if typeof @canClose == 'function'
      if @canClose
        @helper.linkTag('X', -> self.closeTab index).addClass('close').appendTo(li)
    
  @method 'closeTab', (index) ->
    tab = @tabs[index]
    @tabs.splice index, 1
    @trigger 'closedTab', tab, index
    @reload()
    
  @method 'setTabs', (newTabs) ->
    @tabs = newTabs
    @reload() if @loaded
  
  @method 'setActiveTab', (index) ->
    @activeTab = index
    @reload() if @loaded
  
  @method 'switchToTab', (index) ->
    oldIndex = @activeTab
    @setActiveTab index
    @trigger 'switchedTab', oldIndex, index