import jQuery from 'jquery'

import { BaseView } from '../view/base-view'

export const Popup = {
  // Keeps track of unique IDs for popup-enabled elements, to allow closing
  // of the popup, in the event of a second click on the associated element
  _popupID:  -1,
  _popupIDs: 1,
  
  _detach: false,
  
  // Keeps track of callback function to execute on closing the popup
  _closeCallback: null,
  
  _view: null,
  
  keyDown(key) {
    if (key === BaseView.VK_ESCAPE) {
      this.close();
      return true;
    }
  },
  
  close() {
    if (this._popupID) {
      const onClose = this._closeCallback;
      this._closeCallback = null;
      this._popupID = null;
      if (this._view) { this._view.returnKeyboardFocus(); }
      BaseView.method('returnKeyboardFocus').call(this);
      return jQuery('#popup').removeAttr('id').stop().fadeOut(100, function() {
        if (onClose) { onClose(); }
        if (this._view) {
          this._view.release();
          this._view = null;
        }
        
        if (Popup._detach) {
          jQuery(this).children().detach();
        } else if (Popup._reattach) {
          jQuery(document.body).append(jQuery(this).children().hide());
        }
        
        return jQuery(this).remove();
      });
    }
  },
        
  nextId() {
    return this._popupIDs++;
  },
  
  show(element, id, display, options) {
    if (options == null) { options = {}; }
    if (this._popupID === id) { return this.close(); }  
    this.close();

    this._popupID = id;
    this._detach = options.detach;
    this._reattach = options.reattach;

    const offset = element.offset();

    const popup = jQuery('<div id="popup" class="popup"></div>');

    this._closeCallback = function() {
      if (options.close) { return options.close.call(element, element); }
    };
    
    BaseView.method('takeKeyboardFocus').call(this);
    
    if (display instanceof BaseView) {
      this._view = display;
      display.load();
      display.takeKeyboardFocus();
      popup.append(display.element());
    } else if (display instanceof jQuery) {
      popup.append(display.show());
    } else {
      const ul = jQuery("<ul class=\"popupMenu\"></ul>");
      popup.append(ul);

      for (let item of Array.from(display)) {
        if (item === '-') {
          ul.append('<li style="height: 6px"><hr style="margin: 2px" /></li>');
        } else {
          (item => {
            const li = jQuery('<li></li>');
            if (item.className) { li.addClass(item.className); }
            const a = jQuery(`<a href="javascript:;">${item.title || item[0]}</a>`);
            a.click(e => {
              this.close();
              if (item.action) { item.action(); }
              if (item[1]) { return item[1](); }
          });
            li.append(a);
            return ul.append(li);
          })(item);
        }
      }
    }

    popup.mousedown(e => e.stopPropagation());

    popup.appendTo(document.body);
    
    const css = {
      display:  'none',
      position: 'absolute'
    };
    
    if ((offset.left < (jQuery(window).width() - 150)) && !options.right) {
      css.left = Math.round(offset.left);
    } else {
      css.right = Math.round(jQuery(window).width() - offset.left - element.outerWidth());
    }
    
    if (!options.bottom) {
      css.top = Math.floor(offset.top + element.outerHeight());
    } else {
      css.top = Math.floor(offset.top - popup.outerHeight() - (options.offsetY || 0));
    }
    
    return popup.css(css).fadeIn(100);
  },
  
  toString() {
    return 'Popup';
  }
};

// Associates a popup menu with selected elements.
// items   Items for menu, see #popup
// open    Callback function to execute before opening the popup menu
// close   Callback function to execute after the popup menu is closed
export const makePopup = (element, items, open, close, options) => {
  const id = Popup.nextId();
  element.mousedown(e => e.stopPropagation());
  
  let el = null;
  
  options = jQuery.extend({}, options);
  options._close = options.close;
  options.close = function() {
    if (close) { close.call(element, element); }
    if (options._close) { return options._close.call(element, element); }
  };
  
  element.click(function(e) {
    e.preventDefault();
    if (Popup._popupID === id) {
      return Popup.close();
    } else {
      Popup.show(jQuery(this), id, (items.call ? items.call(element, e.altKey || e.shiftKey) : items), options);
      if (open) { open.call(element, element); }
      if (options.open) { return options.open.call(element, element); }
    }
  });
};
