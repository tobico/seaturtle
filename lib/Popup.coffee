# Provides functions to attach single-level popup menus to an element.

# Keeps track of unique IDs for popup-enabled elements, to allow closing
# of the popup, in the event of a second click on the associated element
popupID = -1
popupIDs = 0

# Keeps track of callback function to execute on closing the popup
popupCloseCallback = null

# Closes a popup displayed with #popup
window.closePopup = ->
  if popupCloseCallback
    popupCloseCallback()
    popupCloseCallback = null
  
  popupID = null
  $('#popup').removeAttr('id').stop().slideUp('fast', (-> $(this).remove()))

# Displays a popup menu.
#
# element Element to display popup adjacent to.
# id      Unique ID for this popup menu.
# items   Items to display in menu, as [title, action] arrays,
#         or '-' for a separator
# options Options for popup
#           close: callback function to trigger upon closing the popup
window.popup = (element, id, items, options={}) ->
  if popupID == id
    return closePopup()
  
  closePopup()
  
  popupID = id

  offset = element.offset()
  
  ul = $('<ul>').attr('id', 'popup').addClass('popupMenu')
      .css({
        left: Math.round(offset.left) + 'px',
        top: Math.floor(offset.top + element.height()) + 'px'
      }).hide()
  
  for item in items
    if (item == '-')
      ul.append '<li style="height: 6px"><hr style="margin: 2px" /></li>'
    else
      do (item) ->
        li = $ '<li></li>'
        a = $('<a href="javascript:;">' + (item.title || item[0]) + '</a>')
        a.click (e) ->
          item.action() if item.action
          item[1]() if item[1]
          options.close() if options.close
          closePopup();
        li.append a
        ul.append li
  
  ul.appendTo(document.body).slideDown(50)

# Associates a popup menu with selected elements.
# items   Items for menu, see #popup
# open    Callback function to execute before opening the popup menu
# close   Callback function to execute after the popup menu is closed
jQuery.fn.popup = (items, open, close) ->
  id = popupIDs++
  
  showPopup = (e) ->
    element = this
    
    options = {}
    options.close = -> close.call element if close
    open.call element, element if open
    
    popup $(this), id, (if items.call then items.call(element, e.altKey || e.shiftKey) else items), options
    e.stopPropagation()
  
  @addClass('popup').click(showPopup)
  this