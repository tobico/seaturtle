#= require ST/View

ST.class 'DialogView', 'View', ->
  @initializer 'withTitleView', (title, view) ->
    @init()
    @_element.attr 'id', 'dialog'
    @_element.hide()
    @_element.makeFixed Math.round($(window).width() / 2), 0
    @_element.click (e) -> e.stopPropagation()
    @_element.appendTo document.body
    @load()
    @_children.add view
    @_subView = view
    @_title = title
    @makeHeader()
    @makeFooter()
    @showBlanker()
    @showDialog()
    
  @initializer 'withTitleController', (title, controller) ->
    @controller controller
    @initWithTitleView title, controller.view()
  
  @retainedProperty 'controller'
  
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
  
  @method 'cancelFunction', (fn) ->
    ST.popCancelFunction() if @_cancelFunction
    @_cancelFunction = fn
    ST.pushCancelFunction fn
  
  @method 'showBlanker', ->
    # Add blanker div if it doesn't already exist
    if $('#blanker').length < 1
      $('body').append $('<div id="blanker"></div>').css('opacity', 0).click (e) -> e.stopPropagation()
      
      # Fade blanker in
      if $.browser.webkit
        $('#blanker').css('height', $(document).height())
            .css('width', $(document).width())
            .css('-webkit-transition', 'opacity 100ms linear')
            .css('opacity', 0.6)
      else
        $('#blanker').show().css('opacity', 0).animate {opacity: 0.6}, 100, 'linear'
    else
      # Prevent currently visible blanker from hiding
      $('#blanker').stop().css('opacity', 0.6)
  
  @method 'hideBlanker', ->
    # Get blanker div
    blanker = $ '#blanker'
    if blanker.length > 0
      # Fade blanker out
      blanker.animate {opacity : 0}, 300, 'linear', ->
        blanker.remove()
  
  @method 'showDialog', ->
    self = this
    if $.browser.webkit
      offset = if ST.touch() then window.pageYOffset else 0
      @_element.css('top', offset - @_element.height())
          .show()
          .css('-webkit-transition', 'top 200ms ease-in')
          .css('top', offset)
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

    $('textarea, input, button', @_element).slice(0,1).focus() unless ST.touch()
  
  @method 'hideDialog', (callback) ->
    if $.browser.webkit
      offset = if ST.touch() then window.pageYOffset else 0
      @_element.css('-webkit-transition', 'top 200ms ease-in')
          .css('top', offset - @_element.height())
          .bind 'webkitTransitionEnd', ->
            $(this).unbind('webkitTransitionEnd')
            callback() if callback
    else
      @_element.animate {top: '-' + @_element.height() + 'px'}, 200, 'swing', ->
        callback() if callback
  
  @method 'close', ->
    self = this
    ST.popCancelFunction() if @_cancelFunction
    @trigger 'closed'
    @hideBlanker()
    @hideDialog -> self.release()