STObject.subClass('STViewController', {
    
    init: function()
    {
        this._super();
        this.view = null;
        return this;
    },
    
    destroy: function()
    {
        this.releaseMembers('view')
            ._super();
    },
    
    view: ST.$property('retain'),
    
    viewWillShow: function(view)
    {
        if (this.view && this.view == view && !view.loaded) {
            view.load();
        }
    },
    
end:0});
