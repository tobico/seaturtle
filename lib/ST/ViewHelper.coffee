#= require ST/Object

ST.class 'ViewHelper', ->
  @singleton()
  
  @method 'tag', (name) ->
    $(document.createElement(name))
  
  @method 'linkTag', (contents, action) ->
    $(document.createElement('a'))
      .attr('href', 'javascript:;')
      .append(contents)
      .click(action)

  # Truncates a string to the specified length, adding "..." to the end
  @method 'truncate', (text, length) ->
    if text.length < length
      text
    else
      text.substr(0, length-3) + '...'

  # Instructs the browser to print the specified HTML content
  @method 'print', (html, options={}) ->
    s = "<!doctype html>\n<html><head><title>" + (options.title || '') + '</title>'
    if options.stylesheets
      stylesheets = options.stylesheets
      stylesheets = [stylesheets] unless stylesheets.push
      for stylesheet in stylesheets
        s += '<link type="text/css" rel="stylesheet" href="' + stylesheet + '" />'
    s += '</head><body class="print"'
    s += ' onload="print(); close();"' unless options.preview
    s += '>' + html + '</body></html>'

    o = window.open()
    o.document.open()
    o.document.write s
    o.document.close()
