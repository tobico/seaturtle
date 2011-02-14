ST.class 'View', ->
  @include 'Retained'
  
  @ViewWithContent = (content) ->
    view = @create()
    view.load()
    view.getElement().append content
    view
    
  @constructor ->
    @initWithElement $(document.createElement('view')).addClass(this.$._name)
  
  @constructor 'withElement', (element) ->
    ST.Object.prototype.init.call this
    @helper = ST.ViewHelper.instance()
    @children = ST.List.create()
    @children.bind 'itemAdded', this, 'childAdded'
    @children.bind 'itemRemoved', this, 'childRemoved'
    @header = null
    @footer = null
    @element = element
    @loaded = false
    @rendered = false
    
  @property 'element', null, 'readonly'
  @property 'header', 'retain'
  @property 'footer', 'retain'

  @destructor ->
    @unload() if @loaded
    @releaseMembers 'children', 'header', 'footer'
    @element.remove() if @element
    @empty()
    @_super()
  
  # Current header for this view. Creates a new custom view if no header is
  # currently defined.
  @method 'getOrCreateHeader', ->
    unless @header
      header = STView.createWithElement $(document.createElement 'header')
      header.load()
      @setHeader header
      header.release()
    @header

  # Current footer for this view. Creates a new custom view if no footer is
  # currently defined.
  @method 'getOrCreateFooter', ->
    unless @footer
      footer = STView.createWithElement $(document.createElement 'footer')
      footer.load()
      @setFooter footer
      footer.release()
    @footer
    
  # Sets a view as the header for this view. Headers always remain above
  # any content and all child views for a view.
  @method 'setHeader', (newHeader) ->
    return if newHeader == @header
    if @header
      @header.getElement().detach()
      @header.release()
    
    @header = newHeader
    
    if @header
      @header.retain()
      @element.prepend @header.getElement() if @loaded
  
  @method 'setAndReleaseHeader', (newHeader) ->
    @setHeader newHeader
    newHeader.release()
    
  # Sets a view as the footer for this view. Footers always remain below
  # any content and all child views for a view.
  @method 'setFooter', (newFooter) ->
    return if newFooter == @footer
    if @footer
      @footer.getElement().detach()
      @footer.release()
    
    @footer = newFooter
    
    if @footer
      @footer.retain()
      @element.append @footer.getElement() if @loaded
    
  @method 'setAndReleaseHeader', (newFooter) ->
    @setHeader newFooter
    newFooter.release()
  
  @method 'childAdded', (children, child) ->
    child.parent = this
    if @loaded
      if @footer
        @footer.getElement().before child.getElement()
      else
        @element.append view.getElement()
  
  @method 'childRemoved', (children, child) ->
    child.getElement().detach() if child.loaded
  
  @method 'render', (element) ->
    ST.error 'View rendered twice during load: ' + this if @rendered
    @rendered = true
  
  @method 'load', ->
    return if @loaded
    
    @trigger 'loading'
    
    if @header
      @element.append @header.getElement()
      @header.load unless @header.loaded
        
    @render @element
    @loadChildren()
      
    if @footer
      @element.append @footer.getElement()
      @footer.load unless @footer.loaded
    
    @loaded = true
    @triger 'loaded'
    
  @method 'loadChildren', ->
    self = this
    @children.each (child) ->
      self.element.append child.getElement()
      child.load() unless child.loaded
  
  @method 'unload', ->
    return unless @loaded
    
    @trigger 'unloading'

    @unloadChildren()
    @element.empty()
        
    @rendered = false
    @loaded = false
    
    @trigger 'unloaded'
    
  @method 'unloadChildren', ->
    @children.each 'unload'
    
  @method 'reload', ->
    if @loaded
      @header.getElement().detach() if @header
      @footer.getElement().detach() if @footer
      @unload()
    @load()
        
  @method 'scrollTo', -> $.scrollTo @element
  
  @method 'showDialog', (events) -> ST.Dialog.showView this, events
  
  @method 'stealElement', ->
    element = @element
    @element = null
    element