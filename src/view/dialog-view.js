import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { detectMac, detectTouch } from '../util/detect'
import { BaseView } from './base-view'
import { ButtonBarView } from './button-bar-view'

export const DialogView = makeClass('DialogView', BaseView, (def) => {
  def.DIALOG_ID      = 'dialog';
  def.DIALOG_CLASS   = 'dialog';
  def.HEADER_CLASS   = 'header';
  def.BODY_CLASS     = 'body';
  def.FOOTER_CLASS   = 'footer';
  def.BLANKER_CLASS  = 'blanker';
  def.SHOW_METHOD    = 'slide';
  
  def._blankerCount = 0;
  
  def.initializer(function(args) {
    if (args == null) { args = {}; }
    this.super();
    this._element.attr('id', DialogView.DIALOG_ID);
    this._element.addClass(DialogView.DIALOG_CLASS);
    this._element.hide();
    this._element.mousedown(e => e.stopPropagation());
    this._element.appendTo(document.body);
    this.load();
    this._children.add(args.view);
    this._subView = args.view;
    this._subView.element().wrap(`<div class="${DialogView.BODY_CLASS}" />`);
    this._title = args.title;
    this._autoFocus = args.autoFocus !== false;
    this.makeHeader();
    this.makeFooter();
    DialogView.showBlanker();
    this.showDialog();
    this.takeKeyboardFocus();
    args.view.takeKeyboardFocus();
  });
  
  def.initializer('withTitleView', function(title, view) {
    return this.init({title, view});
  });
      
  def.initializer('withTitleController', function(title, controller) {
    this.controller(controller);
    return this.init({title, view: controller.view()});
  });
  
  def.retainedProperty('controller');
  def.property('cancelFunction');
  
  def.classMethod('confirm', function(title, description, confirm, cancel, fn) {
    const view = BaseView.create();
    view.element().html(description);
    view.dialogButtons = function(dialog, buttonbar) {
      buttonbar.button(confirm, function() {
        dialog.close();
        return fn();
      });
      buttonbar.button(cancel, () => dialog.close());
      if (detectMac()) { return buttonbar.reverse(); }
    };
    const dialog = this.createWithTitleView(title, view);
    return view.release();
  });
  
  def.classMethod('showBlanker', function() {
    this._blankerCount++;
    
    // Add blanker div if it doesn't already exist
    if (jQuery(`.${this.BLANKER_CLASS}`).length < 1) {
      const blanker = jQuery(`<div class="${DialogView.BLANKER_CLASS}"></div>`);
      blanker.css('opacity', 0);
      blanker.click(e => e.stopPropagation());
      jQuery('body').append(blanker);
      blanker.bind('touchstart touchmove touchend', e => e.preventDefault());
    
      // Fade blanker in
      if (jQuery.browser.webkit) {
        return blanker.css('height', jQuery(document).height())
            .css('width', jQuery(document).width())
            .css('-webkit-transition', 'opacity 100ms linear')
            .css('opacity', 0.6);
      } else {
        return blanker.show().animate({opacity: 0.6}, 100, 'linear');
      }
    } else {
      // Prevent currently visible blanker from hiding
      return jQuery('#blanker').stop().css('opacity', 0.6);
    }
  });
  
  def.classMethod('hideBlanker', function() {
    this._blankerCount--;
    return setTimeout(() => {
      if (DialogView._blankerCount <= 0) {
        // Get blanker div
        const blanker = jQuery(`.${this.BLANKER_CLASS}`);
        if (blanker.length > 0) {
          // Fade blanker out
          if (jQuery.browser.webkit) {
            return blanker.css('-webkit-transition', 'opacity 100ms linear')
              .css('opacity', 0.0)
              .bind('webkitTransitionEnd', function() {
                jQuery(this).unbind('webkitTransitionEnd');
                return blanker.remove();
            });
          } else {
            return blanker.animate({opacity : 0}, 300, 'linear', () => blanker.remove());
          }
        }
      }
    }
    , 50);
  });

  def.method('makeHeader', function() {
    const header = BaseView.create();
    header.load();
    header.element()
      .addClass(DialogView.HEADER_CLASS)
      .html(`<h3>${this._title}</h3>`);
    this.header(header);
    return header.release();
  });
  
  def.method('makeFooter', function() {
    const footer = ButtonBarView.create();
    footer.element().addClass(DialogView.FOOTER_CLASS);
    if (this._subView.dialogButtons) {
      this._subView.dialogButtons(this, footer);
    } else {
      footer.button('Close', this.method('close'));
      this.cancelFunction(this.method('close'));
    }
    this.footer(footer);
    return footer.release();
  });
  
  def.method('keyDown', function(key) {
    if (key === BaseView.VK_ESCAPE) {
      if (this._cancelFunction) { this._cancelFunction(); }
      return true;
    }
  });
  
  def.method('showDialog', function() {
    const self = this;
    if (DialogView.SHOW_METHOD === 'slide') {
      if (jQuery.browser.webkit) {
        this._element.css('top', 0 - this._element.height())
            .show()
            .css('-webkit-transition', 'top 200ms ease-in')
            .css('top', 0)
            .bind('webkitTransitionEnd', function() {
              jQuery(this).css('-webkit-transition', '')
                  .unbind('webkitTransitionEnd');
              return self.trigger('opened');
        });
      } else {
        this._element.css('top', `-${this._element.height()}px`)
            .show()
            .animate({top: 0}, 200, 'swing', () => self.trigger('opened'));
      }
    } else if (DialogView.SHOW_METHOD === 'fade') {
      this._element.fadeIn(200);
    }
    
    if (this._autoFocus && !detectTouch()) {
      return jQuery('textarea, input, button', this._element).slice(0,1).focus();
    }
  });
  
  def.method('hideDialog', function(callback) {
    if (DialogView.SHOW_METHOD === 'slide') {
      if (jQuery.browser.webkit) {
        return this._element.css('-webkit-transition', 'top 200ms ease-in')
            .css('top', 0 - this._element.height())
            .bind('webkitTransitionEnd', function() {
              jQuery(this).unbind('webkitTransitionEnd');
              if (callback) { return callback(); }
        });
      } else {
        return this._element.animate({top: `-${this._element.height()}px`}, 200, 'swing', function() {
          if (callback) { return callback(); }
        });
      }
    } else if (DialogView.SHOW_METHOD === 'fade') {
      return this._element.fadeOut(200);
    }
  });
  
  def.method('close', function() {
    const self = this;
    this._subView.returnKeyboardFocus();
    this.returnKeyboardFocus();
    this.trigger('closed');
    DialogView.hideBlanker();
    return this.hideDialog(() => self.release());
  });
});
