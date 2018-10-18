import jQuery from 'jquery'

import { BaseView } from '../view/base-view'

export const Popup = {
  // Keeps track of unique IDs for popup-enabled elements, to allow closing
  // of the popup, in the event of a second click on the associated element
  _popupID:  -1,
  _popupIDs: 1,

  _detach: false,
  _clickAwayBound: false,

  // Keeps track of callback function to execute on closing the popup
  _closeCallback: null,

  _view: null,

  classNames: {
    root: 'popup',
    leftAligned: 'popup--left-aligned',
    rightAligned: 'popup--right-aligned',
    topAligned: 'popup--top-aligned',
    bottomAligned: 'popup--bottom-aligned',
    menu: 'popup__menu',
    menuItem: 'popup__menu-item',
    menuSeparator: 'popup__menu-separator',
    menuHr: 'popup__menu-hr',
    menuLink: 'popup__menu-link',
  },

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
      return jQuery(`.${this.classNames.root}`).removeAttr('id').stop().fadeOut(100, function() {
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

    if (!this._clickAwayBound) {
      this.bindClickAway()
    }

    this._popupID = id;
    this._detach = options.detach;
    this._reattach = options.reattach;

    const offset = element.offset();

    const popup = jQuery(`<div class="${this.classNames.root}"></div>`);

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
      const ul = jQuery(`<ul class="${this.classNames.menu}"></ul>`);
      popup.append(ul);

      for (let item of Array.from(display)) {
        if (item === '-') {
          ul.append(`<li class="${this.classNames.menuSeparator}"><hr class="${this.classNames.menuHr}" /></li>`);
        } else {
          (item => {
            const li = jQuery(`<li class="${this.classNames.menuItem}"></li>`);
            if (item.className) { li.addClass(item.className); }
            const a = jQuery(`<a class="${this.classNames.menuLink}" href="javascript:;">${item.title || item[0]}</a>`);
            a.click(e => {
              this.close();
              const action = item.action || item[1]
              if (action) action.call(item, e)
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
      popup.addClass(this.classNames.leftAligned);
    } else {
      css.right = Math.round(jQuery(window).width() - offset.left - element.outerWidth());
      popup.addClass(this.classNames.rightAligned);
    }

    if (!options.bottom) {
      css.top = Math.floor(offset.top + element.outerHeight());
      popup.addClass(this.classNames.topAligned);
    } else {
      css.top = Math.floor(offset.top - popup.outerHeight() - (options.offsetY || 0));
      popup.addClass(this.classNames.bottomAligned);
    }

    return popup.css(css).fadeIn(100);
  },

  toString() {
    return 'Popup';
  },

  bindClickAway() {
    jQuery(document.body).mousedown(() => Popup.close())
    this._clickAwayBound = true
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
