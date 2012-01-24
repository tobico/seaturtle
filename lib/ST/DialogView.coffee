#= require ST/View

ST.class 'DialogView', 'View', ->
  @initializer (args={}) ->
    @super()
    @_element.attr 'id', 'dialog'
    @_element.hide()
    @_element.mousedown (e) -> e.stopPropagation()
    @_element.appendTo document.body
    @load()
    @_children.add args.view
    @_subView = args.view
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
    header = ST.View.createWithElement($ '<h3></h3>')
    header.load()
    header.element().html @_title
    @header header
    header.release()
  
  @method 'makeFooter', ->
    footer = ST.ButtonBarView.create()
    if @_subView.dialogButtons
      @_subView.dialogButtons this, footer
    else
      footer.button 'Close', @method('close')
    @footer footer
    footer.release()
  
  @method 'keyDown', (key) ->
    if key == ST.View.VK_ESCAPE
      @_cancelFunction() if @_cancelFunction
      true
  
  @method 'showBlanker', ->
    # Add blanker div if it doesn't already exist
    if $('#blanker').length < 1
      blanker = $('<div id="blanker"></div>')
      blanker.css 'opacity', 0
      blanker.click (e) -> e.stopPropagation()
      $('body').append blanker
      blanker.bind 'touchstart touchmove touchend', (e) -> e.preventDefault()
      
      # Fade blanker in
      if $.browser.webkit
        blanker.css('height', $(document).height())
            .css('width', $(document).width())
            .css('-webkit-transition', 'opacity 100ms linear')
            .css('opacity', 0.6)
      else
        blanker.show().animate {opacity: 0.6}, 100, 'linear'
    else
      # Prevent currently visible blanker from hiding
      $('#blanker').stop().css('opacity', 0.6)
  
  @method 'hideBlanker', ->
    # Get blanker div
    blanker = $ '#blanker'
    if blanker.length > 0
      # Fade blanker out
      if $.browser.webkit
        blanker.css('-webkit-transition', 'opacity 100ms linear')
          .css('opacity', 0.0)
          .bind 'webkitTransitionEnd', ->
            $(this).unbind('webkitTransitionEnd')
            blanker.remove()
      else
        blanker.animate {opacity : 0}, 300, 'linear', -> blanker.remove()
  
  @method 'showDialog', ->
    self = this
    if $.browser.webkit
      @_element.css('top', 0 - @_element.height())
          .show()
          .css('-webkit-transition', 'top 200ms ease-in')
          .css('top', 0)
          .bind 'webkitTransitionEnd', ->
            $(this).css('-webkit-transition', '')
                .unbind('webkitTransitionEnd')
            self.trigger 'opened'
    else
      @_element.css('top', '-' + @_element.height() + 'px')
          .show()
          .animate({top: 0}, 200, 'swing', ->
            self.trigger 'opened'
          )
    
    if @_autoFocus && !ST.touch()
      $('textarea, input, button', @_element).slice(0,1).focus()
  
  @method 'hideDialog', (callback) ->
    if $.browser.webkit
      @_element.css('-webkit-transition', 'top 200ms ease-in')
          .css('top', 0 - @_element.height())
          .bind 'webkitTransitionEnd', ->
            $(this).unbind('webkitTransitionEnd')
            callback() if callback
    else
      @_element.animate {top: '-' + @_element.height() + 'px'}, 200, 'swing', ->
        callback() if callback
  
  @method 'close', ->
    self = this
    @_subView.returnKeyboardFocus()
    @returnKeyboardFocus()
    @trigger 'closed'
    @hideBlanker()
    @hideDialog -> self.release()