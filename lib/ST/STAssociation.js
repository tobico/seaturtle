STObject.subClass('STAssociation', {
    
    init: function(model, options)
    {
        this._super();
        this.model = model;
        this.options = options;
    },
    
    find: function(mode, options)
    {
        return this.model.find(mode, this.options);
    },
    
    all: function()
    {
        return this.find('all');
    },
    
    first: function()
    {
        return this.find('first');
    },
    
    each: function(callback)
    {
        this.find('all').each(callback);
    },
end
:0});