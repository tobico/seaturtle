import * as $ from 'jquery'

import { Destructable } from './Destructable'
import { makeClass } from '../util/make-class'
import { ViewHelper } from './ViewHelper'
import { List } from './List'

export const View = makeClass(Destructable, (def) => {
  def.VK_BACKSPACE = 8;
  def.VK_TAB       = 9;
  def.VK_RETURN    = 13;
  def.VK_ESCAPE    = 27;
  def.VK_SPACE     = 32;
  def.VK_PAGE_UP   = 33;
  def.VK_PAGE_DOWN = 34;
  def.VK_END       = 35;
  def.VK_HOME      = 36;
  def.VK_LEFT      = 37;
  def.VK_UP        = 38;
  def.VK_RIGHT     = 39;
  def.VK_DOWN      = 40;
  
  def.ViewWithContent = function(content) {
    const view = this.create();
    view.load();
    view.element().append(content);
    return view;
  };
  
  def.classMethod('keyboardFocusStack', function() {
    if (!View._keyboardFocusStack) {
      View._keyboardFocusStack = List.create();
      $('html').keydown(function(e) {
        let handled = false;
        View._keyboardFocusStack.each(function(view) {
          if (view.keyDown && view.keyDown(e.which)) {
            if (window.console) {
              // Look up constant for key
              let key = e.which;
              for (let a in View) {
                const b = View[a];
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
    
    return View._keyboardFocusStack;
  });
  
  def.initializer(function() {
    const element = ViewHelper.instance().tag('div');
    element.addClass(this._class._name);
    return this.initWithElement(element);
  });
  
  def.initializer('withElement', function(element) {
    Destructable.method('init').call(this);
    this._element = element;
    this._loaded = false;
    this._visible = true;
    this._children = List.create();
    this._children.bind('itemAdded',   this, 'childAdded');
    return this._children.bind('itemRemoved', this, 'childRemoved');
  });
  
  def.property('parent');
  def.property('children', 'read');
  def.property('element',  'read');
  def.property('loaded',   'read');
  def.property('visible');
  
  def.retainedProperty('header');
  def.retainedProperty('footer');
  
  def.delegate('add', 'children', 'addChild');
  def.delegate('remove', 'children', 'removeChild');

  def.destructor(function() {
    if (this._loaded) { this.unload(); }
    this._children.empty();
    this._children.unbind(this);
    this._element.remove();
    return this.super();
  });
  
  def.method('helper', () => ViewHelper.instance());
    
  // Sets a view as the header for this view. Headers always remain above
  // any content and all child views for a view.
  def.method('_headerChanged', function(oldHeader, newHeader) {
    if (oldHeader) { oldHeader.element().detach(); }
    if (newHeader && this._loaded) {
      newHeader.load();
      return this._element.prepend(newHeader.element());
    }
  });
  
  // Sets a view as the footer for this view. Footers always remain below
  // any content and all child views for a view.
  def.method('_footerChanged', function(oldFooter, newFooter) {
    if (oldFooter) { oldFooter.element().detach(); }
    if (newFooter && this._loaded) {
      newFooter.load();
      return this._element.append(newFooter.element());
    }
  });
  
  def.method('childAdded', function(children, child) {
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
  
  def.method('childRemoved', function(children, child) {
    if (this._loaded) { return child.element().detach(); }
  });
  
  def.method('load', function() {
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
    
  def.method('loadChildren', function() {
    const element = this._element;
    return this._children.each(function(child) {
      element.append(child.element());
      return child.load();
    });
  });
  
  def.method('unload', function() {
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
    
  def.method('unloadChildren', function() {
    return this._children.each(function(child) {
      child.unload();
      return child.element().detach();
    });
  });
    
  def.method('reload', function() {
    this.unload();
    return this.load();
  });
  
  def.method('show', function() {
    if (!this._visible) { return this.visible(true); }
  });
  
  def.method('hide', function() {
    if (this._visible) { return this.visible(false); }
  });
  
  def.method('setVisible', function(value) {
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
  
  def.method('takeKeyboardFocus', function() {
    const stack = View.keyboardFocusStack();
    return stack.insertAt(0, this);
  });
  
  def.method('returnKeyboardFocus', function() {
    const stack = View.keyboardFocusStack();
    return stack.remove(this);
  });
  
  def.method('scrollTo', function() { return $.scrollTo(this._element); });
  
  def.method('showDialog', function(events) { return Dialog.showView(this, events); });
});

// jQuery.fn.addView = function(view) {
//   this.append(view.element());
//   view.load();
//   return this;
// };
