import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { BaseView } from './base-view'

export const TabView = makeClass('TabView', BaseView, (def) => {
  def.initializer(function() {
    this.initWithElement(this.helper().tag('ul').addClass('tabs'));
    this._tabs = [];
    this._tabIndex = 0;
    this._truncateLength = false;
    return this._canClose = null;
  });
  
  def.property('tabs');
  def.property('tabIndex');
  def.property('truncateLength');
  def.property('canClose');
  
  def.method('render', function() {
    const self = this;
    this.element().empty();
    
    return Array.from(this._tabs).map((tab, index) =>
      (index => {
        const li = this.helper().tag('li');
      
        let title = tab;
        if (this._truncateLength) { title = this.helper.truncate(title, this._truncateLength); }
        title = String(title);
      
        const span = jQuery(`<span class="title">${title}</span>`);
        li.append(span);
      
        if (index === this._tabIndex) {
          span.addClass('active_title');
          li.addClass('hl');
        } else {
          span.addClass('inactive_title').mousedown(() => {
            this.switchToTab(index);
            if (window.closePopup) { return closePopup(); }
          });
        }
      
        if (typeof this._canClose === 'function') { this._canClose = this._canClose(tab, index); }
        if (this._canClose) { this.helper().linkTag('X', () => self.closeTab(index)).addClass('close').appendTo(li); }
      
        return this.element().append(li);
      })(index));
  });
    
  def.method('closeTab', function(index) {
    const tab = this._tabs[index];
    this._tabs.splice(index, 1);
    this.trigger('closedTab', tab, index);
    return this.render();
  });
    
  def.method('setTabs', function(newTabs) {
    this._tabs = newTabs;
    if (this._loaded) { return this.render(); }
  });
  
  def.method('setTabIndex', function(index) {
    this._tabIndex = index;
    if (this._loaded) { return this.render(); }
  });
  
  def.method('switchToTab', function(index) {
    const oldIndex = this._tabIndex;
    this.tabIndex(index);
    return this.trigger('switchedTab', oldIndex, index);
  });
});
