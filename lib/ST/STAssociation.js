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

    has:            ST.$forward('all'),
    each:           ST.$forward('all'),
    any:            ST.$forward('all'),
    find:           ST.$forward('all'),
    sort:           ST.$forward('all'),
    map:            ST.$forward('all'),
    mapToStdArray:  ST.$forward('all'),
    toArray:        ST.$forward('all', 'copy'),
    toStdArray:     ST.$forward('all'),
    collect:        ST.$forward('all'),
    reject:         ST.$forward('all'),
        
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
    
    count: function()
    {
        return this.all().length;
    },
    
    destroyAll: function()
    {
        this.each('destroy');
    },
    
    build: function(data) {
        return this.model.createWithData($.extend(
            {},
            this.conditions,
            data
        ));
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