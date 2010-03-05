STView.subClass('STTabView', {
    init: function()
    {
        this._super();
        this.tabs = ST.A();
        this.activeTab = 0;
        this.delegate = null;
    },
    
    delegate: ST.$property(),
    tabs: ST.$property(),
    activeTab: ST.$property(),
    
    render: function(element)
    {
        this._super(element);
        
        var self = this;
        
        var ul = ST.ulTag().addClass('tabs').appendTo(element);
        
        this.tabs.each(function(tab, i) {
            var li = ST.liTag().appendTo(ul);
            
            if (i == self.activeTab) {
                li.append(ST.spanTag(self.tabs[i]).addClass('hl'));
            } else {
                li.append(ST.aTag(self.tabs[i]).mousedown(function() {
                    self.switchToTab(i);
                }));
            }
            
            if (self.delegate && self.delegate.tabViewCanCloseTab
                && self.delegate.tabViewCanCloseTab(self, i)) {
                ST.aTag('X').addClass('close').click(function() {
                    self.tabs.removeAtIndex(i);
                    if (self.delegate && self.delegate.tabViewClosedTab) {
                        self.delegate.tabViewClosedTab(self, i);
                    }
                    self.reload();
                }).appendTo(li);
            }
        });
    },
    
    setTabs: function(tabs)
    {
        this.tabs = tabs;
        if (this.loaded) this.reload();
    },
    
    setActiveTab: function(activeTab)
    {
        this.activeTab = activeTab;
        if (this.loaded) this.reload();
    },
    
    switchToTab: function(index)
    {
        var oldIndex = this.activeTab;
        this.setActiveTab(index);
        if (this.delegate && this.delegate.tabViewSwitchedTab) {
            this.delegate.tabViewSwitchedTab(this, oldIndex, index);
        }
    },

end
:0});