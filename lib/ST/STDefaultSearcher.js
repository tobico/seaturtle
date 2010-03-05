STSearcher.subClass('STDefaultSearcher', {
    initWithCallback: function(callback)
    {
        this.init();
        this.callback = callback;
    },
    
    search: function(term)
    {
        if (!(this.delegate && this.delegate.searcherFoundResult)) return;
        this.delegate.searcherFoundResult(this,
            this.callback(term, this.hilight(term)));
    },
    
end
:0});