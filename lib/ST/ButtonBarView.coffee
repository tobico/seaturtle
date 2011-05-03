#require ST/View
#require Popup

ST.class 'ButtonBarView', 'View', ->
  @initializer ->
    @super()
    @_buttons = []
  
  @method 'render', ->
    self = this
    
    html = []
    for button, i in @_buttons
      if button.alternatives.length
        html.push '<span class="alt_button"><a href="javascript:;" class="button alt_button_main" data-index="', i, '">', button.title, '</a><a href="javascript:;" class="button alt_button_more" data-index="', i, '"><span class="dropdown">V</span></a></span>'
      else
        html.push '<a href="javascript:;" class="button simple_button" data-index="', i, '">', button.title, '</a>'
    
    @_element.html html.join('')
    
    $('a', @_element).each ->
      index = $(this).attr 'data-index'
      if $(this).is('.alt_button_more')
        items = []
        for alt in self._buttons[index].alternatives
          items.push [alt.title, alt.action]
        $(this).popup items
      else
        $(this).click self._buttons[index].action
  
  @method 'button', (title, action) ->
    @_buttons.push {
      title:  title
      action: action
      alternatives: []
    }
    @_buttons.length - 1
  
  @method 'alternative', (title, action) ->
    @_buttons[@_buttons.length - 1].alternatives.push {
      title:  title
      action: action
    }
    @_buttons.length - 1
  
  @method 'buttonElement', (index) ->
    $('a[data-index=' + index + ']', @_element)
  
  @method 'buttonTitle', (index, title) ->
    @buttonElement(index).html title if @_loaded
  
  @method 'buttonDisabled', (index, disabled) ->
    if @_loaded
      button = @buttonElement index
      if disabled?
        if disabled
          button.addClass 'disabled'
        else
          button.removeClass 'disabled'
        disabled
      else
        !!button.is('.disabled')