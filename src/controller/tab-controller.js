import { makeClass } from '../core/make-class'
import { List } from '../core/list'
import { BaseView } from '../view/base-view'
import { TabView } from '../view/tab-view'
import { BaseController } from './base-controller'

export const TabController = makeClass('TabControler', BaseController, (def) => {
  def.initializer(function() {
    this.super();
    const view = BaseView.create();
    this.view(view);
    view.release();
    this._tabs = List.create();
    this._tabs.bind('itemAdded',   this, 'tabAdded');
    this._tabs.bind('itemChanged', this, 'tabChanged');
    this._tabs.bind('itemRemoved', this, 'tabRemoved');
    this._tabView = null;
    this._activeTab = null;
    return this._hideSingleTab = false;
  });
  
  def.property('tabs');
  def.retainedProperty('tabView');
  def.property('activeTab');
  def.property('hideSingleTab');
  
  def.destructor(function() {
    this._tabs.empty();
    this._tabs.unbindAll(this);
    return this.super();
  });
  
  def.method('viewLoaded', function(view) {
    const tabView = TabView.create();
    this.tabView(tabView);
    this._view.addChild(tabView);
    tabView.bind('switchedTab', this, 'viewSwitchedTab');
    tabView.release();
    return this.activeTab(this._tabs.first());
  });
  
  def.method('viewSwitchedTab', function(view, oldIndex, newIndex) {
    return this.activeTab(this._tabs.at(newIndex));
  });
  
  def.method('updateTabView', function() {
    if (this._tabView) {
      if (this._hideSingleTab && (this._tabs.count() === 1)) {
        return this._tabView.hide();
      } else {
        this._tabView.show();
        this._tabView.tabs(this._tabs.mapArray(function(tab) { if (tab.tabTitle) { return tab.tabTitle(); } else { return 'Untitled'; } }));
        return this._tabView.tabIndex(Math.max(this._tabs.indexOf(this._activeTab), 0));
      }
    }
  });
  
  def.method('tabAdded', function(tabs, tab) {
    if (tabs.count() === 1) {
      return this.activeTab(tab);
    } else {
      return this.updateTabView();
    }
  });
  
  def.method('tabRemoved', function(tabs, tab, index) {
    if (this._activeTab === tab) {
      return this.activeTab(tabs.at(index) || tabs.at(index - 1) || null);
    } else {
      return this.updateTabView();
    }
  });

  def.method('tabChanged', function(tabs, tab, attribute, oldValue, newValue) {
    if (attribute === 'tabTitle') { return this.updateTabView(); }
  });
  
  def.method('_activeTabChanged', function(oldTab, newTab) {
    const self = this;
    this.updateTabView();
    const oldView = oldTab && oldTab.view();
    const newView = newTab && newTab.view();
    const switchViews = function() {
      if (oldView) {
        oldView.hide();
        self._view.removeChild(oldView);
      }
      if (newView) {
        self._view.addChild(newView);
        return newView.show();
      }
    };
    
    if (newTab && !newTab.view().loaded()) {
      // Switch child views asynchronously, so that user gets response
      // instantly, even if the new view takes a while to load
      return setTimeout(switchViews, 1);
    } else {
      return switchViews();
    }
  });
});
