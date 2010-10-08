STObject.subClass('STAssociation', {
    
    init: function(model, options)
    {
        this._super();
        this.model = model;
        this.conditions = options.conditions || {};
        for (var attribute in this.conditions) {
            this.model.getValueIndex(attribute, this.conditions[attribute])
                .bind('itemAdded', this, 'indexItemAdded')
                .bind('itemRemoved', this, 'indexItemRemoved')
                .bind('itemChanged', this, 'indexItemChanged');
            break;
        }
    },
    
    find: function(mode, options)
    {
        var opt = {conditions:this.conditions};
        if (options && options.conditions) {
            opt.conditions = $.extend({}, this.conditions, options.conditions);
        }
        return this.model.find(mode, opt);
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
    
    count: function()
    {
        return this.all().length;
    },
    
    destroyAll: function()
    {
        this.each('destroy');
    },
    
    indexItemAdded: function(index, item) {
        if (item.matches(this.conditions)) {
            this.trigger('itemAdded', item);
        }
    },
    
    indexItemRemoved: function(index, item) {
        if (item.destroyed || !item.matches(this.conditions)) {
            this.trigger('itemRemoved', item);
        }
    },
    
    indexItemChanged: function(index, item) {
        if (item.matches(this.conditions)) {
            this.trigger('itemChanged', item);
        }
    },
end
:0});