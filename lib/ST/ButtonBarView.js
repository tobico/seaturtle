/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/View
//= require Popup

ST.class('ButtonBarView', 'View', function() {
  this.BUTTON_BAR_CLASS = 'button_bar';
  this.BUTTON_CLASS = 'button';
  this.BUTTON_WRAPPER_CLASS = '';
  this.DEFAULT_BUTTON_CLASS = 'default';
  this.CANCEL_BUTTON_CLASS = 'cancel';
  this.SINGLE_BUTTON_CLASS = 'simple_button';
  this.ALT_BUTTON_MAIN_CLASS = 'alt_button_main';
  this.ALT_BUTTON_MORE_CLASS = 'alt_button_more';
  this.ALT_BUTTON_MORE_CONTENT = '<span class="dropdown">V</span>';
  
  this.initializer(function() {
    this.super();
    this._buttons = [];
    return this._element.addClass(ST.ButtonBarView.BUTTON_BAR_CLASS);
  });
  
  this.method('render', function() {
    const self = this;
    
    const html = [];
    for (let i = 0; i < this._buttons.length; i++) {
      const button = this._buttons[i];
      html.push('<span class="', ST.ButtonBarView.BUTTON_WRAPPER_CLASS, '">');
      if (button.alternatives.length) {
        html.push(
          '<span class="alt_button"><a href="javascript:;" class="',
          ST.ButtonBarView.BUTTON_CLASS, ' ',
          ST.ButtonBarView.ALT_BUTTON_MAIN_CLASS, ' ',
          '" data-index="', i, '">', button.title,
          '</a><a href="javascript:;" class="',
          ST.ButtonBarView.BUTTON_CLASS, ' ',
          ST.ButtonBarView.ALT_BUTTON_MORE_CLASS, '" data-index="', i,
          '">', ST.ButtonBarView.ALT_BUTTON_MORE_CONTENT, '</a></span>'
        );
      } else {
        html.push('<a href="javascript:;" class="',
          ST.ButtonBarView.BUTTON_CLASS, ' ',
          ST.ButtonBarView.SINGLE_BUTTON_CLASS);
        if (button.cancel) { html.push(' ', ST.ButtonBarView.CANCEL_BUTTON_CLASS); }
        if (button.default) { html.push(' ', ST.ButtonBarView.DEFAULT_BUTTON_CLASS); }
        html.push('" data-index="', i, '">',
          button.title, '</a>');
      }
      html.push('</span>');
    }
    
    this._element.html(html.join(''));
    
    return $('a', this._element).each(function() {
      const index = $(this).attr('data-index');
      if ($(this).is(`.${ST.ButtonBarView.ALT_BUTTON_MORE_CLASS}`)) {
        return $(this).popup(self.itemsForAlternatives(self._buttons[index].alternatives));
      } else {
        return $(this).click(self._buttons[index].action);
      }
    });
  });
  
  this.method('reverse', function() {
    return this._buttons.reverse();
  });
  
  this.method('button', function(title, options, action) {
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
  
  this.method('alternative', function(title, action, secret) {
    if (secret == null) { secret = false; }
    this._buttons[this._buttons.length - 1].alternatives.push({
      title,
      action,
      secret
    });
    return this._buttons.length - 1;
  });
  
  this.method('buttonElement', function(index) {
    return $(`a[data-index=${index}]`, this._element);
  });
  
  this.method('buttonTitle', function(index, title) {
    if (this._loaded) { return this.buttonElement(index).html(title); }
  });
  
  this.method('buttonDisabled', function(index, disabled) {
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
  
  return this.method('itemsForAlternatives', alternatives =>
    function(full) {
      const items = [];
      for (let alt of Array.from(alternatives)) {
        if (!alt.secret || full) { items.push([alt.title, alt.action]); }
      }
      return items;
    }
  );
});
  