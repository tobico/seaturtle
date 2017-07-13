/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Destructable
//= require ST/List
//= require ST/ViewHelper

ST.class('View', 'Destructable', function() {
  this.VK_BACKSPACE = 8;
  this.VK_TAB       = 9;
  this.VK_RETURN    = 13;
  this.VK_ESCAPE    = 27;
  this.VK_SPACE     = 32;
  this.VK_PAGE_UP   = 33;
  this.VK_PAGE_DOWN = 34;
  this.VK_END       = 35;
  this.VK_HOME      = 36;
  this.VK_LEFT      = 37;
  this.VK_UP        = 38;
  this.VK_RIGHT     = 39;
  this.VK_DOWN      = 40;
  
  this.ViewWithContent = function(content) {
    const view = this.create();
    view.load();
    view.element().append(content);
    return view;
  };
  
  this.classMethod('keyboardFocusStack', function() {
    if (!ST.View._keyboardFocusStack) {
      ST.View._keyboardFocusStack = ST.List.create();
      $('html').keydown(function(e) {
        let handled = false;
        ST.View._keyboardFocusStack.each(function(view) {
          if (view.keyDown && view.keyDown(e.which)) {
            if (window.console) {
              // Look up constant for key
              let key = e.which;
              for (let a in ST.View) {
                const b = ST.View[a];
                if (b === key) { key = a; }
              }
              console.log(`Keydown: Key ${key} handled by ${view}`); 
            }
            handled = true;
            return 'break';
          }
        });
        if (handled) {
          e.stopPropagation();
          return e.preventDefault();
        }
      });
    }
    
    return ST.View._keyboardFocusStack;
  });
  
  this.initializer(function() {
    const element = ST.ViewHelper.instance().tag('div');
    element.addClass(this._class._name);
    return this.initWithElement(element);
  });
  
  this.initializer('withElement', function(element) {
    ST.Destructable.method('init').call(this);
    this._element = element;
    this._loaded = false;
    this._visible = true;
    this._children = ST.List.create();
    this._children.bind('itemAdded',   this, 'childAdded');
    return this._children.bind('itemRemoved', this, 'childRemoved');
  });
  
  this.property('parent');
  this.property('children', 'read');
  this.property('element',  'read');
  this.property('loaded',   'read');
  this.property('visible');
  
  this.retainedProperty('header');
  this.retainedProperty('footer');
  
  this.delegate('add', 'children', 'addChild');
  this.delegate('remove', 'children', 'removeChild');

  this.destructor(function() {
    if (this._loaded) { this.unload(); }
    this._children.empty();
    this._children.unbind(this);
    this._element.remove();
    return this.super();
  });
  
  this.method('helper', () => ST.ViewHelper.instance());
    
  // Sets a view as the header for this view. Headers always remain above
  // any content and all child views for a view.
  this.method('_headerChanged', function(oldHeader, newHeader) {
    if (oldHeader) { oldHeader.element().detach(); }
    if (newHeader && this._loaded) {
      newHeader.load();
      return this._element.prepend(newHeader.element());
    }
  });
  
  // Sets a view as the footer for this view. Footers always remain below
  // any content and all child views for a view.
  this.method('_footerChanged', function(oldFooter, newFooter) {
    if (oldFooter) { oldFooter.element().detach(); }
    if (newFooter && this._loaded) {
      newFooter.load();
      return this._element.append(newFooter.element());
    }
  });
  
  this.method('childAdded', function(children, child) {
    child.parent(this);
    if (this._loaded) {
      child.load();
      if (this._footer) {
        return this._footer.element().before(child.element());
      } else {
        return this._element.append(child.element());
      }
    }
  });
  
  this.method('childRemoved', function(children, child) {
    if (this._loaded) { return child.element().detach(); }
  });
  
  this.method('load', function() {
    if (!this._loaded) {
      this.trigger('loading');
    
      if (this._header) {
        this.element().append(this._header.element());
        this._header.load();
      }
        
      if (this.render) { this.render(); }
      this.loadChildren();
      
      if (this._footer) {
        this._element.append(this._footer.element());
        this._footer.load();
      }
    
      this._loaded = true;
      return this.trigger('loaded');
    }
  });
    
  this.method('loadChildren', function() {
    const element = this._element;
    return this._children.each(function(child) {
      element.append(child.element());
      return child.load();
    });
  });
  
  this.method('unload', function() {
    if (this._loaded) {
      this.trigger('unloading');
      if (this._header) { this._header.element().detach(); }
      if (this._footer) { this._footer.element().detach(); }
      this.unloadChildren();
      this._element.empty();
      this._element.remove();
      this._loaded = false;
      return this.trigger('unloaded');
    }
  });
    
  this.method('unloadChildren', function() {
    return this._children.each(function(child) {
      child.unload();
      return child.element().detach();
    });
  });
    
  this.method('reload', function() {
    this.unload();
    return this.load();
  });
  
  this.method('show', function() {
    if (!this._visible) { return this.visible(true); }
  });
  
  this.method('hide', function() {
    if (this._visible) { return this.visible(false); }
  });
  
  this.method('setVisible', function(value) {
    if (value !== this._visible) {
      if (this._visible = value) {
        if (!this._loaded) { this.load(); }
        this.element().show();
        return this.trigger('shown');
      } else {
        this.element().hide();
        return this.trigger('hidden');
      }
    }
  });
  
  this.method('takeKeyboardFocus', function() {
    const stack = ST.View.keyboardFocusStack();
    return stack.insertAt(0, this);
  });
  
  this.method('returnKeyboardFocus', function() {
    const stack = ST.View.keyboardFocusStack();
    return stack.remove(this);
  });
  
  this.method('scrollTo', function() { return $.scrollTo(this._element); });
  
  return this.method('showDialog', function(events) { return Dialog.showView(this, events); });
});

jQuery.fn.addView = function(view) {
  this.append(view.element());
  view.load();
  return this;
};