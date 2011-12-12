ST.class 'ListView', 'View', ->
  @property 'list'
  @property 'display'
  @property 'selectable'
  @property 'selected'
  
  @initializer (options={}) ->
    @initWithElement($ '<ul></ul>')
    @_element.attr 'id', options.id if options.id
    @list options.list
    @display options.display
    @selectable(options.selectable || false)
    @selected options.selected
  
  @method 'render', ->
    @_LIs = {}
    @_list.each (item) =>
      li = $('<li>' + @display()(item) + '</li>')
      li.addClass 'selected' if item is @_selected
      @_LIs[item._uid] = li
      if @_selectable
        li.click =>
          $('.selected', @_element).removeClass('selected')
          li.addClass('selected')
          @selected item
          @trigger 'selected', item
      @_element.append li
    
  
  @method '_listChanged', (oldValue, newValue) ->
    if @loaded()
      @_element.empty()
      @render()
  
  @method '_selectedChanged', (oldValue, newValue) ->
    if @loaded()
      if li = @_LIs[oldValue._uid]
        li.removeClass 'selected'
      if li = @_LIs[newValue._uid]
        li.addClass 'selected'