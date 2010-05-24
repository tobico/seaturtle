STViewController.subClass('STTabController', {
    init: function()
    {
        this._super();
        this.view = STView.create().setDelegate(this);
        this.tabView = null;
        this.tabControllers = STIndexedArray.create();
        this.activeTab = null;
        this.hideSingleTab = false;
        this.tabTruncateLength = false;
    },
    
    activeTab:      ST.$property,
    tabView:        ST.$property('retain', 'readonly'),
    tabTruncateLength: ST.$property,
    hideSingleTab:  ST.$property,
    
    destroy: function()
    {
        this.tabControllers.release();
        if (this.tabView) {
            this.tabView.unbindAll(this).release();
        }
        this._super();
    },
    
    setActiveTab: function(newTab)
    {   
        if (this.activeTab) {   
            if (this.activeTab.viewWillHide) this.activeTab.viewWillHide(this.activeTab.view);
            this.view.removeChild(this.activeTab.view);
            if (this.activeTab.viewDidHide) this.activeTab.viewDidHide(this.activeTab.view);
        }
        
        if (!this.tabControllers.has(newTab)) return;
        $.scrollTo(0,0);
        
        this.activeTab = newTab;
        if (this.activeTab.viewWillShow) this.activeTab.viewWillShow(this.activeTab.view);
        this.view.addChild(this.activeTab.view);
        if (this.activeTab.viewDidShow) this.activeTab.viewDidShow(this.activeTab.view);
    },
    
    viewDidLoad: function(view)
    {
        if (view != this.view) return;
        
        if (!this.tabView) {
            this.tabView = STTabView.create().setDelegate(this);
            this.tabView.bind('switchedTab', this, 'tabViewSwitchedTab');
            this.tabView.setCanClose(this.methodFn('canCloseTab'));
            this.tabView.setTruncateLength(this.tabTruncateLength);
            this.tabView.bind('closedTab', this, 'tabViewClosedTab')
            this.view.addChild(this.tabView);
        }
        this.updateTabView();
        if (this.tabControllers.count()) {
            this.setActiveTab(this.tabControllers.first());
        }
    },
    
    canCloseTab: function(tab, index)
    {
        var controller = this.tabControllers.objectAtIndex(index);
        return !!(controller && controller.closedTab);
    },

    tabViewClosedTab: function(tabView, tab, index)
    {
        var controller = this.tabControllers.objectAtIndex(index);
        if (controller && controller.closedTab) controller.closedTab();
    },
    
    tabViewSwitchedTab: function(tabView, oldIndex, newIndex)
    {
        this.setActiveTab(this.tabControllers.objectAtIndex(newIndex));
    },
    
    updateTabView: function()
    {
        if (!this.view.loaded) return;
        if (this.hideSingleTab && this.tabControllers.count() <= 1) return;
        
        if (!this.tabView.loaded) this.tabView.load();
        
        var tabs = ST.A();
        this.tabControllers.each(function(controller) {
            tabs.push(controller.tabTitle || '');
        });
        this.tabView.setTabs(tabs);
        this.tabView.setActiveTab(Math.max(this.tabControllers.indexOfObject(this.activeTab), 0));
    },
    
    emptyTabs: function()
    {
        if (this.activeTab) {
            this.view.removeChild(this.activeTab.view);
            this.activeTab = null;
        }
        this.tabControllers.empty();
    },
    
    addTab: function(tab)
    {
        var tc = this;
        
        tab.setTabTitle = function(tabTitle) {
            this.tabTitle = tabTitle;
            tc.updateTabView();
        };
        
        if (!this.tabControllers.count() && this.view.loaded) {
            this.setActiveTab(tab);
        }
        
        this.tabControllers.add(tab);
        this.updateTabView();
    },
    
    addAndReleaseTab: function(tab)
    {
        this.addTab(tab);
        tab.release();
    },
    
    insertTabAtIndex: function(tab, index)
    {
        var tc = this;
        
        tab.setTabTitle = function(tabTitle) {
            this.tabTitle = tabTitle;
            tc.updateTabView();
        };
        
        this.tabControllers.insertObjectAtIndex(tab, index);
        
        this.updateTabView();
    },
    
    insertTabBefore: function(tab, before)
    {
        if (before && before.index != null) {
            this.insertTabAtIndex(tab, before.index)
        }
    },
    
    insertTabAfter: function(tab, after)
    {
        if (after && after.index >= 0 && after.index < (this.tabControllers.count() - 1)) {
            this.insertTabAtIndex(tab, after.index + 1);
        } else {
            this.addTab(tab);
        }
    },
    
    removeTab: function(tab)
    {
        var index = this.tabControllers.indexOfObject(tab);
        if (this.activeTab == tab) {
            this.setActiveTab(tab.next || tab.prev || null);
        }
        this.tabControllers.remove(tab);
        this.updateTabView();
    },
    
end
:0});