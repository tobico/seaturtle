STObject.subClass('STViewController', {
    
    init: function()
    {
        this._super();
        this.view = false;
        return this;
    },
    
    destroy: function()
    {
        this.setView(null)._super();
    },
    
    view: ST.$property('retain'),
    
    viewWillShow: function(view)
    {
        if (this.view && this.view == view && !view.loaded) {
            view.load();
        }
    },
    
end:0});
