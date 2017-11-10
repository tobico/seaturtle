#= require ST/View
#= require ST/ButtonBarView

ST.class 'DialogView', 'View', ->
  @DIALOG_ID      = 'dialog'
  @DIALOG_CLASS   = 'dialog'
  @HEADER_CLASS   = 'header'
  @BODY_CLASS     = 'body'
  @FOOTER_CLASS   = 'footer'
  @BLANKER_CLASS  = 'blanker'
  @SHOW_METHOD    = 'slide'
  
  @_blankerCount = 0
  
  @initializer (args={}) ->
    @super()
    @_element.attr 'id', ST.DialogView.DIALOG_ID
    @_element.addClass ST.DialogView.DIALOG_CLASS
    @_element.hide()
    @_element.mousedown (e) -> e.stopPropagation()
    @_element.appendTo document.body
    @load()
    @_children.add args.view
    @_subView = args.view
    @_subView.element().wrap('<div class="' + ST.DialogView.BODY_CLASS + '" />')
    @_title = args.title
    @_autoFocus = args.autoFocus isnt false
    @makeHeader()
    @makeFooter()
    @showBlanker()
    @showDialog()
    @takeKeyboardFocus()
    args.view.takeKeyboardFocus()
  
  @initializer 'withTitleView', (title, view) ->
    @init title: title, view: view
      
  @initializer 'withTitleController', (title, controller) ->
    @controller controller
    @init title: title, view: controller.view()
  
  @retainedProperty 'controller'
  @property 'cancelFunction'
  
  @classMethod 'confirm', (title, description, confirm, cancel, fn) ->
    view = ST.View.create()
    view.element().html description
    view.dialogButtons = (dialog, buttonbar) ->
      buttonbar.button confirm, fn
      buttonbar.button cancel, -> dialog.close()
      buttonbar.reverse() if ST.mac()
    dialog = @createWithTitleView title, view
    view.release()
  
  @method 'makeHeader', ->
    header = ST.View.create()
    header.load()
    header.element()
      .addClass(ST.DialogView.HEADER_CLASS)
      .html('<h3>' + @_title + '</h3>')
    @header header
    header.release()
  
  @method 'makeFooter', ->
    footer = ST.ButtonBarView.create()
    footer.element().addClass ST.DialogView.FOOTER_CLASS
    if @_subView.dialogButtons
      @_subView.dialogButtons this, footer
    else
      footer.button 'Close', @method('close')
      @cancelFunction @method('close')
    @footer footer
    footer.release()
  
  @method 'keyDown', (key) ->
    if key == ST.View.VK_ESCAPE
      @_cancelFunction() if @_cancelFunction
      true
  
  @method 'showBlanker', ->
    ST.DialogView._blankerCount++
    
    # Add blanker div if it doesn't already exist
    if $('.' + ST.DialogView.BLANKER_CLASS).length < 1
      blanker = $('<div class="' + ST.DialogView.BLANKER_CLASS + '"></div>')
      blanker.css 'opacity', 0
      blanker.click (e) -> e.stopPropagation()
      $('body').append blanker
      blanker.bind 'touchstart touchmove touchend', (e) -> e.preventDefault()
    
      # Fade blanker in
      blanker.show().animate {opacity: 0.6}, 100, 'linear'
    else
      # Prevent currently visible blanker from hiding
      $('#blanker').stop().css('opacity', 0.6)
  
  @method 'hideBlanker', ->
    ST.DialogView._blankerCount--
    if ST.DialogView._blankerCount <= 0
      # Get blanker div
      blanker = $('.' + ST.DialogView.BLANKER_CLASS)
      if blanker.length > 0
        # Fade blanker out
        blanker.animate {opacity : 0}, 300, 'linear', -> blanker.remove()
  
  @method 'showDialog', ->
    self = this
    if ST.DialogView.SHOW_METHOD is 'slide'
      @_element.css('top', '-' + @_element.height() + 'px')
          .show()
          .animate({top: 0}, 200, 'swing', ->
            self.trigger 'opened'
          )
    else if ST.DialogView.SHOW_METHOD is 'fade'
      @_element.fadeIn(200)
    
    if @_autoFocus && !ST.touch()
      $('textarea, input, button', @_element).slice(0,1).focus()
  
  @method 'hideDialog', (callback) ->
    if ST.DialogView.SHOW_METHOD is 'slide'
      @_element.animate {top: '-' + @_element.height() + 'px'}, 200, 'swing', ->
        callback() if callback
    else if ST.DialogView.SHOW_METHOD is 'fade'
      @_element.fadeOut(200)
  
  @method 'close', ->
    self = this
    @_subView.returnKeyboardFocus()
    @returnKeyboardFocus()
    @trigger 'closed'
    @hideBlanker()
    @hideDialog -> self.release()