ST.class 'ViewHelper', ->
  @singleton()
  
  @method 'tag', (name) ->
    $(document.createElement(name))
  
  @method 'linkTag', (contents, action) ->
    $(document.createElement('a')).attr('href', 'javascript:;').click(action)

  # Truncates a string to the specified length, adding "..." to the end
  @method 'truncate', (text, length) ->
    if text.length < length
      text
    else
      text.substr(0, length-3) + '...'

  # Instructs the browser to print the specified HTML content
  @method 'printHTML', (html, title, stylesheets) ->
    s = "<!doctype html>\n<html><head><title>" + (title || '') + '</title>'
    if stylesheets
      stylesheets = [stylesheets] unless stylesheets.length
      for stylesheet in stylesheets
        s += '<link type="text/css" rel="stylesheet" href="' + stylesheet + '" />'
    s += '</head><body class="print" onload="print(); close();">' + html + '</body></html>'

    useFrame = $.browser.mozilla
    if useFrame
      $('body').append '<iframe name="printFrame" id="printFrame" style="position: absolute; top : -1000px;"></iframe>' unless $('#printFrame').length
      o = frames['printFrame'] || document.getElementById('printFrame').contentWindow
    else
      o = window.open
    o.document.open()
    o.document.write s
    o.document.close()
    o.print() if useFrame