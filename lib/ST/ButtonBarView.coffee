#require ST/View

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
  
  @method 'alternative', (title, action) ->
    @_buttons[@_buttons.length - 1].alternatives.push {
      title:  title
      action: action
    }