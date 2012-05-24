#= require ST/View
#= require Popup

ST.class 'ButtonBarView', 'View', ->
  @BUTTON_BAR_CLASS = 'button_bar'
  @BUTTON_CLASS = 'button'
  @BUTTON_WRAPPER_CLASS = ''
  @DEFAULT_BUTTON_CLASS = 'default'
  @CANCEL_BUTTON_CLASS = 'cancel'
  @SINGLE_BUTTON_CLASS = 'simple_button'
  @ALT_BUTTON_MAIN_CLASS = 'alt_button_main'
  @ALT_BUTTON_MORE_CLASS = 'alt_button_more'
  @ALT_BUTTON_MORE_CONTENT = '<span class="dropdown">V</span>'
  
  @initializer ->
    @super()
    @_buttons = []
    @_element.addClass ST.ButtonBarView.BUTTON_BAR_CLASS
  
  @method 'render', ->
    self = this
    
    html = []
    for button, i in @_buttons
      html.push '<span class="', ST.ButtonBarView.BUTTON_WRAPPER_CLASS, '">'
      if button.alternatives.length
        html.push(
          '<span class="alt_button"><a href="javascript:;" class="',
          ST.ButtonBarView.BUTTON_CLASS, ' ',
          ST.ButtonBarView.ALT_BUTTON_MAIN_CLASS, ' ',
          '" data-index="', i, '">', button.title,
          '</a><a href="javascript:;" class="',
          ST.ButtonBarView.BUTTON_CLASS, ' ',
          ST.ButtonBarView.ALT_BUTTON_MORE_CLASS, '" data-index="', i,
          '">', ST.ButtonBarView.ALT_BUTTON_MORE_CONTENT, '</a></span>'
        )
      else
        html.push '<a href="javascript:;" class="',
          ST.ButtonBarView.BUTTON_CLASS, ' ',
          ST.ButtonBarView.SINGLE_BUTTON_CLASS
        html.push ' ', ST.ButtonBarView.CANCEL_BUTTON_CLASS if button.cancel
        html.push ' ', ST.ButtonBarView.DEFAULT_BUTTON_CLASS if button.default
        html.push '" data-index="', i, '">',
          button.title, '</a>'
      html.push '</span>'
    
    @_element.html html.join('')
    
    $('a', @_element).each ->
      index = $(this).attr 'data-index'
      if $(this).is('.' + ST.ButtonBarView.ALT_BUTTON_MORE_CLASS)
        $(this).popup self.itemsForAlternatives(self._buttons[index].alternatives)
      else
        $(this).click self._buttons[index].action
  
  @method 'reverse', ->
    @_buttons.reverse()
  
  @method 'button', (title, options, action) ->
    if arguments.length is 2
      action = options
      options = {}
    
    @_buttons.push $.extend({
      title:  title
      action: action
      alternatives: []
    }, options)
    @_buttons.length - 1
  
  @method 'alternative', (title, action, secret=false) ->
    @_buttons[@_buttons.length - 1].alternatives.push {
      title:  title
      action: action
      secret: secret
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
  
  @method 'itemsForAlternatives', (alternatives) ->
    (full) ->
      items = []
      for alt in alternatives
        items.push [alt.title, alt.action] if !alt.secret || full
      items
  