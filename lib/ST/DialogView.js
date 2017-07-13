/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/View
//= require ST/ButtonBarView

ST.class('DialogView', 'View', function() {
  this.DIALOG_ID      = 'dialog';
  this.DIALOG_CLASS   = 'dialog';
  this.HEADER_CLASS   = 'header';
  this.BODY_CLASS     = 'body';
  this.FOOTER_CLASS   = 'footer';
  this.BLANKER_CLASS  = 'blanker';
  this.SHOW_METHOD    = 'slide';
  
  this._blankerCount = 0;
  
  this.initializer(function(args) {
    if (args == null) { args = {}; }
    this.super();
    this._element.attr('id', ST.DialogView.DIALOG_ID);
    this._element.addClass(ST.DialogView.DIALOG_CLASS);
    this._element.hide();
    this._element.mousedown(e => e.stopPropagation());
    this._element.appendTo(document.body);
    this.load();
    this._children.add(args.view);
    this._subView = args.view;
    this._subView.element().wrap(`<div class="${ST.DialogView.BODY_CLASS}" />`);
    this._title = args.title;
    this._autoFocus = args.autoFocus !== false;
    this.makeHeader();
    this.makeFooter();
    ST.DialogView.showBlanker();
    this.showDialog();
    this.takeKeyboardFocus();
    return args.view.takeKeyboardFocus();
  });
  
  this.initializer('withTitleView', function(title, view) {
    return this.init({title, view});
  });
      
  this.initializer('withTitleController', function(title, controller) {
    this.controller(controller);
    return this.init({title, view: controller.view()});
  });
  
  this.retainedProperty('controller');
  this.property('cancelFunction');
  
  this.classMethod('confirm', function(title, description, confirm, cancel, fn) {
    const view = ST.View.create();
    view.element().html(description);
    view.dialogButtons = function(dialog, buttonbar) {
      buttonbar.button(confirm, function() {
        dialog.close();
        return fn();
      });
      buttonbar.button(cancel, () => dialog.close());
      if (ST.mac()) { return buttonbar.reverse(); }
    };
    const dialog = this.createWithTitleView(title, view);
    return view.release();
  });
  
  this.classMethod('showBlanker', function() {
    this._blankerCount++;
    
    // Add blanker div if it doesn't already exist
    if ($(`.${this.BLANKER_CLASS}`).length < 1) {
      const blanker = $(`<div class="${ST.DialogView.BLANKER_CLASS}"></div>`);
      blanker.css('opacity', 0);
      blanker.click(e => e.stopPropagation());
      $('body').append(blanker);
      blanker.bind('touchstart touchmove touchend', e => e.preventDefault());
    
      // Fade blanker in
      if ($.browser.webkit) {
        return blanker.css('height', $(document).height())
            .css('width', $(document).width())
            .css('-webkit-transition', 'opacity 100ms linear')
            .css('opacity', 0.6);
      } else {
        return blanker.show().animate({opacity: 0.6}, 100, 'linear');
      }
    } else {
      // Prevent currently visible blanker from hiding
      return $('#blanker').stop().css('opacity', 0.6);
    }
  });
  
  this.classMethod('hideBlanker', function() {
    this._blankerCount--;
    return setTimeout(() => {
      if (ST.DialogView._blankerCount <= 0) {
        // Get blanker div
        const blanker = $(`.${this.BLANKER_CLASS}`);
        if (blanker.length > 0) {
          // Fade blanker out
          if ($.browser.webkit) {
            return blanker.css('-webkit-transition', 'opacity 100ms linear')
              .css('opacity', 0.0)
              .bind('webkitTransitionEnd', function() {
                $(this).unbind('webkitTransitionEnd');
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

  this.method('makeHeader', function() {
    const header = ST.View.create();
    header.load();
    header.element()
      .addClass(ST.DialogView.HEADER_CLASS)
      .html(`<h3>${this._title}</h3>`);
    this.header(header);
    return header.release();
  });
  
  this.method('makeFooter', function() {
    const footer = ST.ButtonBarView.create();
    footer.element().addClass(ST.DialogView.FOOTER_CLASS);
    if (this._subView.dialogButtons) {
      this._subView.dialogButtons(this, footer);
    } else {
      footer.button('Close', this.method('close'));
      this.cancelFunction(this.method('close'));
    }
    this.footer(footer);
    return footer.release();
  });
  
  this.method('keyDown', function(key) {
    if (key === ST.View.VK_ESCAPE) {
      if (this._cancelFunction) { this._cancelFunction(); }
      return true;
    }
  });
  
  this.method('showDialog', function() {
    const self = this;
    if (ST.DialogView.SHOW_METHOD === 'slide') {
      if ($.browser.webkit) {
        this._element.css('top', 0 - this._element.height())
            .show()
            .css('-webkit-transition', 'top 200ms ease-in')
            .css('top', 0)
            .bind('webkitTransitionEnd', function() {
              $(this).css('-webkit-transition', '')
                  .unbind('webkitTransitionEnd');
              return self.trigger('opened');
        });
      } else {
        this._element.css('top', `-${this._element.height()}px`)
            .show()
            .animate({top: 0}, 200, 'swing', () => self.trigger('opened'));
      }
    } else if (ST.DialogView.SHOW_METHOD === 'fade') {
      this._element.fadeIn(200);
    }
    
    if (this._autoFocus && !ST.touch()) {
      return $('textarea, input, button', this._element).slice(0,1).focus();
    }
  });
  
  this.method('hideDialog', function(callback) {
    if (ST.DialogView.SHOW_METHOD === 'slide') {
      if ($.browser.webkit) {
        return this._element.css('-webkit-transition', 'top 200ms ease-in')
            .css('top', 0 - this._element.height())
            .bind('webkitTransitionEnd', function() {
              $(this).unbind('webkitTransitionEnd');
              if (callback) { return callback(); }
        });
      } else {
        return this._element.animate({top: `-${this._element.height()}px`}, 200, 'swing', function() {
          if (callback) { return callback(); }
        });
      }
    } else if (ST.DialogView.SHOW_METHOD === 'fade') {
      return this._element.fadeOut(200);
    }
  });
  
  return this.method('close', function() {
    const self = this;
    this._subView.returnKeyboardFocus();
    this.returnKeyboardFocus();
    this.trigger('closed');
    ST.DialogView.hideBlanker();
    return this.hideDialog(() => self.release());
  });
});