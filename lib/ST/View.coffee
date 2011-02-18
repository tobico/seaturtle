ST.class 'View', 'Destructable', ->
  @ViewWithContent = (content) ->
    view = @create()
    view.load()
    view.element().append content
    view
    
  @initializer ->
    element = ST.ViewHelper.instance().tag('view')
    element.addClass @_class._name
    @initWithElement element
  
  @initializer 'withElement', (element) ->
    ST.Destructable.method('init').call this
    @_element = element
    @_loaded = false
    @_rendered = false
  
  @property 'parent'
  @property 'children', 'read'
  @property 'header'
  @property 'footer'
  @property 'element',  'read'
  @property 'loaded',   'read'
  @property 'rendered', 'read'

  @destructor ->
    @unload() if @loaded()
    if @_children
      @_children.empty()
      @_children.unbind this
    @releaseProperties 'children', 'header', 'footer'
    @element().remove()
    @super()
  
  @method 'helper', ->
    ST.ViewHelper.instance()
  
  @method 'getChildren', ->
    unless @_children
      @_children = ST.List.create()
      @_children.bind 'itemAdded',   this, 'childAdded'
      @_children.bind 'itemRemoved', this, 'childRemoved'
    @_children
    
  # Sets a view as the header for this view. Headers always remain above
  # any content and all child views for a view.
  @method 'setHeader', (newHeader) ->
    return if newHeader == @header
    if @_header
      @_header.element().detach()
      @_header.release()
    
    @_header = newHeader
    
    if @_header
      @_header.retain()
      @element.prepend @_header.element() if @loaded()
    
  # Sets a view as the footer for this view. Footers always remain below
  # any content and all child views for a view.
  @method 'setFooter', (newFooter) ->
    return if newFooter == @footer
    if @_footer
      @_footer.element().detach()
      @_footer.release()
    
    @_footer = newFooter
    
    if @_footer
      @_footer.retain()
      @element.append @_footer.getElement() if @loaded()
  
  @method 'childAdded', (children, child) ->
    child.parent this
    if @loaded()
      if @footer()
        @footer().element().before child.element()
      else
        @element().append view.element()
  
  @method 'childRemoved', (children, child) ->
    child.element().detach() if child.loaded()
  
  @method 'render', (element) ->
    ST.error 'View rendered twice during load: ' + this if @_rendered
    @_rendered = true
  
  @method 'load', ->
    unless @loaded()
      @trigger 'loading'
    
      if @header()
        @element().append @header().element()
        @header().load
        
      @render @element()
      @loadChildren()
      
      if @footer()
        @element().append @footer().element()
        @footer().load
    
      @_loaded = true
      @trigger 'loaded'
    
  @method 'loadChildren', ->
    element = @element()
    @children().each (child) ->
      element.append child.element()
      child.load()
  
  @method 'unload', ->
    if @loaded()
      @trigger 'unloading'
      @unloadChildren()
      @element().empty()
      @_rendered = false
      @_loaded = false
      @trigger 'unloaded'
    
  @method 'unloadChildren', ->
    @children().each 'unload'
    
  @method 'reload', ->
    if @loaded()
      @header().element().detach() if @header()
      @footer().element().detach() if @footer()
      @unload()
    @load()
        
  @method 'scrollTo', -> $.scrollTo @element()
  
  @method 'showDialog', (events) -> ST.Dialog.showView this, events