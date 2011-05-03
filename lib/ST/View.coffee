#require ST/Destructable
#require ST/List
#require ST/ViewHelper

ST.class 'View', 'Destructable', ->
  @ViewWithContent = (content) ->
    view = @create()
    view.load()
    view.element().append content
    view
    
  @initializer ->
    element = ST.ViewHelper.instance().tag('div')
    element.addClass @_class._name
    @initWithElement element
  
  @initializer 'withElement', (element) ->
    ST.Destructable.method('init').call this
    @_element = element
    @_loaded = false
    @_children = ST.List.create()
    @_children.bind 'itemAdded',   this, 'childAdded'
    @_children.bind 'itemRemoved', this, 'childRemoved'
  
  @property 'parent'
  @property 'children', 'read'
  @property 'element',  'read'
  @property 'loaded',   'read'
  
  @retainedProperty 'header'
  @retainedProperty 'footer'
  
  @delegate 'add', 'children', 'addChild'
  @delegate 'remove', 'children', 'removeChild'

  @destructor ->
    @unload() if @_loaded
    @_children.empty()
    @_children.unbind this
    @_element.remove()
    @super()
  
  @method 'helper', ->
    ST.ViewHelper.instance()
    
  # Sets a view as the header for this view. Headers always remain above
  # any content and all child views for a view.
  @method '_headerChanged', (oldHeader, newHeader) ->
    oldHeader.element().detach() if oldHeader
    if newHeader && @_loaded
      newHeader.load()
      @_element.prepend newHeader.element()
  
  # Sets a view as the footer for this view. Footers always remain below
  # any content and all child views for a view.
  @method '_footerChanged', (oldFooter, newFooter) ->
    oldFooter.element().detach() if oldFooter
    if newFooter && @_loaded
      newFooter.load()
      @_element.append newFooter.element()
  
  @method 'childAdded', (children, child) ->
    child.parent this
    if @_loaded
      child.load()
      if @_footer
        @_footer.element().before child.element()
      else
        @_element.append child.element()
  
  @method 'childRemoved', (children, child) ->
    child.element().detach() if @_loaded
  
  @method 'load', ->
    unless @_loaded
      @trigger 'loading'
    
      if @_header
        @element().append @_header.element()
        @_header.load()
        
      @render() if @render
      @loadChildren()
      
      if @_footer
        @_element.append @_footer.element()
        @_footer.load()
    
      @_loaded = true
      @trigger 'loaded'
    
  @method 'loadChildren', ->
    element = @_element
    @_children.each (child) ->
      element.append child.element()
      child.load()
  
  @method 'unload', ->
    if @_loaded
      @trigger 'unloading'
      @_header.element().detach() if @_header
      @_footer.element().detach() if @_footer
      @unloadChildren()
      @_element.empty()
      @_element.remove()
      @_loaded = false
      @trigger 'unloaded'
    
  @method 'unloadChildren', ->
    @_children.each (child) ->
      child.unload()
      child.element().detach()
    
  @method 'reload', ->
    @unload()
    @load()
  
  @method 'show', ->
    @load() unless @_loaded
    @element().show()
  
  @method 'hide', ->
    @element().hide()
        
  @method 'scrollTo', -> $.scrollTo @_element
  
  @method 'showDialog', (events) -> Dialog.showView this, events