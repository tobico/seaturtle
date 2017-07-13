import * as $ from 'jquery'

import { BaseObject } from '../BaseObject'
import { makeClass } from '../../util/make-class'

export const ListView = makeClass(View, (def) => {
  def.property('list');
  def.property('display');
  def.property('selectable');
  def.property('selected');
  
  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.initWithElement($('<ul></ul>'));
    if (options.id) { this._element.attr('id', options.id); }
    this.list(options.list);
    this.display(options.display);
    this.selectable(options.selectable || false);
    return this.selected(options.selected);
  });
  
  def.method('render', function() {
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
    
  
  def.method('_listChanged', function(oldValue, newValue) {
    if (this.loaded()) {
      this._element.empty();
      return this.render();
    }
  });
  
  def.method('_selectedChanged', function(oldValue, newValue) {
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
