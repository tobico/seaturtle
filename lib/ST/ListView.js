/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
ST.class('ListView', 'View', function() {
  this.property('list');
  this.property('display');
  this.property('selectable');
  this.property('selected');
  
  this.initializer(function(options) {
    if (options == null) { options = {}; }
    this.initWithElement($('<ul></ul>'));
    if (options.id) { this._element.attr('id', options.id); }
    this.list(options.list);
    this.display(options.display);
    this.selectable(options.selectable || false);
    return this.selected(options.selected);
  });
  
  this.method('render', function() {
    this._LIs = {};
    return this._list.each(item => {
      const li = $(`<li>${this.display()(item)}</li>`);
      if (item === this._selected) { li.addClass('selected'); }
      this._LIs[item._uid] = li;
      if (this._selectable) {
        li.click(() => {
          $('.selected', this._element).removeClass('selected');
          li.addClass('selected');
          this.selected(item);
          return this.trigger('selected', item);
        });
      }
      return this._element.append(li);
    });
  });
    
  
  this.method('_listChanged', function(oldValue, newValue) {
    if (this.loaded()) {
      this._element.empty();
      return this.render();
    }
  });
  
  return this.method('_selectedChanged', function(oldValue, newValue) {
    if (this.loaded()) {
      let li;
      if (li = this._LIs[oldValue._uid]) {
        li.removeClass('selected');
      }
      if (li = this._LIs[newValue._uid]) {
        return li.addClass('selected');
      }
    }
  });
});