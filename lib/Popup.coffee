# Provides functions to attach single-level popup menus to an element.

# Keeps track of unique IDs for popup-enabled elements, to allow closing
# of the popup, in the event of a second click on the associated element
popupID = -1
popupIDs = 1

# Keeps track of callback function to execute on closing the popup
popupCloseCallback = null

# Closes a popup displayed with #popup
window.closePopup = ->
  if popupID
    ST.popCancelFunction()
    onClose = popupCloseCallback
    popupCloseCallback = null
    popupID = null
    $('#popup').removeAttr('id').stop().fadeOut 100, ->
      onClose() if onClose
      $(this).remove()

# Displays a popup menu.
window.popup = (element, id, display, options={}) ->
  return closePopup() if popupID == id  
  closePopup()
  
  ST.pushCancelFunction closePopup
  
  popupID = id
  
  offset = element.offset()
  
  popup = $ '<div id="popup" class="popup"></div>'
  
  popupCloseCallback = ->
    options.close.call element, element if options.close
    display.release() if display.release
  
  if ST.View && (display instanceof ST.View)
    display.load()
    popup.append display.element()
  else
    ul = $ "<ul class=\"popupMenu\"></ul>"
    popup.append ul

    for item in display
      if (item == '-')
        ul.append '<li style="height: 6px"><hr style="margin: 2px" /></li>'
      else
        do (item) ->
          li = $ '<li></li>'
          a = $('<a href="javascript:;">' + (item.title || item[0]) + '</a>')
          a.click (e) ->
            closePopup()
            item.action() if item.action
            item[1]() if item[1]
          li.append a
          ul.append li
  
  popup.click (e) -> e.stopPropagation()
  
  style = if offset.left < $(window).width() - 150
    "left: #{Math.round offset.left}px"
  else
    "right: #{Math.round($(window).width() - offset.left - element.outerWidth())}px"
  popup.attr 'style', "#{style}; top: #{Math.floor(offset.top + element.outerHeight())}px; display: none; position: absolute"
  
  popup.appendTo(document.body).fadeIn(100)

# Associates a popup menu with selected elements.
# items   Items for menu, see #popup
# open    Callback function to execute before opening the popup menu
# close   Callback function to execute after the popup menu is closed
jQuery.fn.popup = (items, open, close) ->
  id = popupIDs++
  @click (e) ->
    e.stopPropagation()
    element = this
    options = {}
    options.close = -> close.call element if close
    if popupID == id
      closePopup()
    else
      popup $(this), id, (if items.call then items.call(element, e.altKey || e.shiftKey) else items), options
      open.call element, element if open