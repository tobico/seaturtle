STObject.subClass('STStorage', {
    instance: ST.$singleton,
    
    init: function() {
        var self = this;
        $(function() {
            $(document).bind('storage', self.methodFn('storageEvent'));
        });
        this.changesMade = 0;
    },
    
    isActive: function()
    {
        return !!window.localStorage;
    },
    
    storageEvent: function(evt)
    {
        if (this.changesMade > 0) {
            this.changesMade--;
        } else {
            this.trigger('externalChange', evt);
        }
    },
    
    set: function(key, value)
    {
        if (window.localStorage) {
            this.changesMade++;
            window.localStorage[key] = JSON.stringify(value);
        }
    },
    
    get: function(key)
    {
        return window.localStorage && JSON.parse(window.localStorage[key]);
    },
    
    remove: function(key)
    {
        if (window.localStorage) {
            this.changesMade++;
            delete window.localStorage[key];
        }
    },
    
end
:0});