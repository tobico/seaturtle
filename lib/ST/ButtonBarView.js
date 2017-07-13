import * as $ from 'jquery'

import { View } from '../View'
import { makeClass } from '../../util/make-class'

export const ButtonBarView = makeClass(View, (def) => {
  def.BUTTON_BAR_CLASS = 'button_bar';
  def.BUTTON_CLASS = 'button';
  def.BUTTON_WRAPPER_CLASS = '';
  def.DEFAULT_BUTTON_CLASS = 'default';
  def.CANCEL_BUTTON_CLASS = 'cancel';
  def.SINGLE_BUTTON_CLASS = 'simple_button';
  def.ALT_BUTTON_MAIN_CLASS = 'alt_button_main';
  def.ALT_BUTTON_MORE_CLASS = 'alt_button_more';
  def.ALT_BUTTON_MORE_CONTENT = '<span class="dropdown">V</span>';
  
  def.initializer(function() {
    this.super();
    this._buttons = [];
    return this._element.addClass(ButtonBarView.BUTTON_BAR_CLASS);
  });
  
  def.method('render', function() {
    const self = this;
    
    const html = [];
    for (let i = 0; i < this._buttons.length; i++) {
      const button = this._buttons[i];
      html.push('<span class="', ButtonBarView.BUTTON_WRAPPER_CLASS, '">');
      if (button.alternatives.length) {
        html.push(
          '<span class="alt_button"><a href="javascript:;" class="',
          ButtonBarView.BUTTON_CLASS, ' ',
          ButtonBarView.ALT_BUTTON_MAIN_CLASS, ' ',
          '" data-index="', i, '">', button.title,
          '</a><a href="javascript:;" class="',
          ButtonBarView.BUTTON_CLASS, ' ',
          ButtonBarView.ALT_BUTTON_MORE_CLASS, '" data-index="', i,
          '">', ButtonBarView.ALT_BUTTON_MORE_CONTENT, '</a></span>'
        );
      } else {
        html.push('<a href="javascript:;" class="',
          ButtonBarView.BUTTON_CLASS, ' ',
          ButtonBarView.SINGLE_BUTTON_CLASS);
        if (button.cancel) { html.push(' ', ButtonBarView.CANCEL_BUTTON_CLASS); }
        if (button.default) { html.push(' ', ButtonBarView.DEFAULT_BUTTON_CLASS); }
        html.push('" data-index="', i, '">',
          button.title, '</a>');
      }
      html.push('</span>');
    }
    
    this._element.html(html.join(''));
    
    return $('a', this._element).each(function() {
      const index = $(this).attr('data-index');
      if ($(this).is(`.${ButtonBarView.ALT_BUTTON_MORE_CLASS}`)) {
        return $(this).popup(self.itemsForAlternatives(self._buttons[index].alternatives));
      } else {
        return $(this).click(self._buttons[index].action);
      }
    });
  });
  
  def.method('reverse', function() {
    return this._buttons.reverse();
  });
  
  def.method('button', function(title, options, action) {
    if (arguments.length === 2) {
      action = options;
      options = {};
    }
    
    this._buttons.push($.extend({
      title,
      action,
      alternatives: []
    }, options)
    );
    return this._buttons.length - 1;
  });
  
  def.method('alternative', function(title, action, secret) {
    if (secret == null) { secret = false; }
    this._buttons[this._buttons.length - 1].alternatives.push({
      title,
      action,
      secret
    });
    return this._buttons.length - 1;
  });
  
  def.method('buttonElement', function(index) {
    return $(`a[data-index=${index}]`, this._element);
  });
  
  def.method('buttonTitle', function(index, title) {
    if (this._loaded) { return this.buttonElement(index).html(title); }
  });
  
  def.method('buttonDisabled', function(index, disabled) {
    if (this._loaded) {
      const button = this.buttonElement(index);
      if (disabled != null) {
        if (disabled) {
          button.addClass('disabled');
        } else {
          button.removeClass('disabled');
        }
        return disabled;
      } else {
        return !!button.is('.disabled');
      }
    }
  });
  
  def.method('itemsForAlternatives', alternatives =>
    function(full) {
      const items = [];
      for (let alt of Array.from(alternatives)) {
        if (!alt.secret || full) { items.push([alt.title, alt.action]); }
      }
      return items;
    }
  );
});
  