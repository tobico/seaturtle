/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Object

ST.class('ViewHelper', function() {
  this.singleton();
  
  this.method('tag', name => $(document.createElement(name)));
  
  this.method('linkTag', (contents, action) =>
    $(document.createElement('a'))
      .attr('href', 'javascript:;')
      .append(contents)
      .click(action)
  );

  // Truncates a string to the specified length, adding "..." to the end
  this.method('truncate', function(text, length) {
    if (text.length < length) {
      return text;
    } else {
      return text.substr(0, length-3) + '...';
    }
  });

  // Instructs the browser to print the specified HTML content
  return this.method('print', function(html, options) {
    if (options == null) { options = {}; }
    let s = `<!doctype html>\n<html><head><title>${options.title || ''}</title>`;
    if (options.stylesheets) {
      let { stylesheets } = options;
      if (!stylesheets.push) { stylesheets = [stylesheets]; }
      for (let stylesheet of Array.from(stylesheets)) {
        s += `<link type="text/css" rel="stylesheet" href="${stylesheet}" />`;
      }
    }
    s += '</head><body class="print"';
    if (!options.preview) { s += ' onload="print(); close();"'; }
    s += `>${html}</body></html>`;

    const o = window.open();
    o.document.open();
    o.document.write(s);
    return o.document.close();
  });
});
