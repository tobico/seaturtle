STView.subClass('STTabView', {
    init: function()
    {
        this._super();
        this.tabs = ST.A();
        this.activeTab = 0;
        this.truncateLength = false;
        this.canClose = false;
    },
    
    tabs:           ST.$property,
    activeTab:      ST.$property,
    truncateLength: ST.$property,
    canClose:       ST.$property,
    
    render: function(element)
    {
        this._super(element);
        
        var self = this;
        
        var ul = ST.ulTag().addClass('tabs').appendTo(element);
        
        this.tabs.each(function(tab, i) {
            var li = ST.liTag().appendTo(ul);
            
            var title = tab;
            if (self.truncateLength) {
                title = ST.truncate(title, self.truncateLength);
            }
            
            if (i == self.activeTab) {
                li.append(ST.spanTag(title).addClass('hl')).addClass('hl');
            } else {
                li.append(ST.aTag(title).mousedown(function() {
                    self.switchToTab(i);
                }));
            }
            
            var canClose = self.canClose;
            if (typeof canClose == 'function') canClose = canClose(tab, i);
            if (canClose) {
                ST.aTag('X')
                    .addClass('close')
                    .click(function() { self.closeTab(i); })
                    .appendTo(li);
            }
        });
    },
    
    closeTab: function(index)
    {
        var tab = this.tabs[index];
        this.tabs.removeAtIndex(index);
        this.trigger('closedTab', tab, index);
        this.reload();
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
        this.trigger('switchedTab', oldIndex, index)
    },

end
:0});