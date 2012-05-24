# Provides functions to attach single-level popup menus to an element.

window.Popup = {
  # Keeps track of unique IDs for popup-enabled elements, to allow closing
  # of the popup, in the event of a second click on the associated element
  _popupID:  -1
  _popupIDs: 1
  
  _detach: false
  
  # Keeps track of callback function to execute on closing the popup
  _closeCallback: null
  
  _view: null
  
  keyDown: (key) ->
    if key == (if window.ST && ST.View then ST.View.VK_ESCAPE else 27)
      @close()
      true
  
  close: ->
    if @_popupID
      onClose = @_closeCallback
      @_closeCallback = null
      @_popupID = null
      @_view.returnKeyboardFocus() if @_view
      ST.View.method('returnKeyboardFocus').call(this) if window.ST && ST.View
      $('#popup').removeAttr('id').stop().fadeOut 100, ->
        onClose() if onClose
        if @_view
          @_view.release()
          @_view = null
        
        if Popup._detach
          $(this).children().detach()
        else if Popup._reattach
          $(document.body).append $(this).children().hide()
        
        $(this).remove()
        
  nextId: ->
    @_popupIDs++
  
  show: (element, id, display, options={}) ->
    return @close() if @_popupID == id  
    @close()

    @_popupID = id
    @_detach = options.detach
    @_reattach = options.reattach

    offset = element.offset()

    popup = $ '<div id="popup" class="popup"></div>'

    @_closeCallback = ->
      options.close.call element, element if options.close
    
    ST.View.method('takeKeyboardFocus').call(this) if window.ST && ST.View
    
    if window.ST && ST.View && (display instanceof ST.View)
      @_view = display
      display.load()
      display.takeKeyboardFocus()
      popup.append display.element()
    else if display instanceof jQuery
      popup.append display.show()
    else
      ul = $ "<ul class=\"popupMenu\"></ul>"
      popup.append ul

      for item in display
        if (item == '-')
          ul.append '<li style="height: 6px"><hr style="margin: 2px" /></li>'
        else
          do (item) =>
            li = $ '<li></li>'
            li.addClass item.className if item.className
            a = $('<a href="javascript:;">' + (item.title || item[0]) + '</a>')
            a.click (e) =>
              @close()
              item.action() if item.action
              item[1]() if item[1]
            li.append a
            ul.append li

    popup.mousedown (e) -> e.stopPropagation()

    style = if (offset.left < $(window).width() - 150) && !options.right
      "left: #{Math.round offset.left}px"
    else
      "right: #{Math.round($(window).width() - offset.left - element.outerWidth())}px"
    popup.attr 'style', "#{style}; top: #{Math.floor(offset.top + element.outerHeight())}px; display: none; position: absolute"

    popup.appendTo(document.body).fadeIn(100)
  
  toString: ->
    'Popup'
}

window.closePopup = -> Popup.close()
window.popup = -> Popup.show()

# Associates a popup menu with selected elements.
# items   Items for menu, see #popup
# open    Callback function to execute before opening the popup menu
# close   Callback function to execute after the popup menu is closed
jQuery.fn.popup = (items, open, close, options) ->
  id = Popup.nextId()
  @mousedown (e) -> e.stopPropagation()
  
  element = null
  
  options = $.extend({}, options);
  options._close = options.close
  options.close = ->
    close.call element, element if close
    options._close.call element, element if options._close
  
  @click (e) ->
    e.preventDefault()
    element = this
    if Popup._popupID == id
      Popup.close()
    else
      Popup.show $(this), id, (if items.call then items.call(element, e.altKey || e.shiftKey) else items), options
      open.call element, element if open
      options.open.call element, element if options.open