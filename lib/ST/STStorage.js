STObject.subClass('STStorage', {
    NONE: 0,
    DATABASE: 1,
    LOCAL: 2,
    
    Supported: function() {
        return window.openDatabase || window.localStorage;
    },
    
    instance: ST.$singleton,
    
    init: function() {
        var self = this;
        
        this.storageType = STStorage.NONE;
        
        if (window.openDatabase) {
            try {
                this.database = window.openDatabase('ststorage', '1.0', 'STStorage Data Store', 10485760);
                this.database.transaction(function(transaction) {
                    transaction.executeSql('create table data(`key` text not null primary key, `value` text not null)');
                });
                this.storageType = STStorage.DATABASE;
            } catch(e) {
            }
        } else if (window.localStorage) {
            this.storageType = STStorage.LOCAL;
        }
        
        if (window.localStorage) {
            $(function() {
                if ($.browser.safari) {
                    window.addEventListener('storage', self.methodFn('storageEvent'), false);
                } else {
                    $(document).bind('storage', self.methodFn('storageEvent'));
                }
            });
            this.changesMade = 1;
            window.localStorage.removeItem('storageTest');
        }
    },
    
    isActive: function()
    {
        return this.storageType != STStorage.NONE;
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
        var self = this;
        
        var json = JSON.stringify(value);
        
        switch(this.storageType) {
            case STStorage.DATABASE:
                this.database.transaction(function(transaction) {
                    transaction.executeSql('insert into data (key, value) values (?, ?)', [key, json]);
                }, function() {
                    self.database.transaction(function(transaction) {
                        transaction.executeSql('update data set value = ? where key = ?', [json, key]);
                    });
                });
                break;
            case STStorage.LOCAL:
                this.changesMade++;
                window.localStorage.setItem(key, json);
                break;
        }
    },
    
    fetch: function(key, callback)
    {
        switch(this.storageType) {
            case STStorage.DATABASE:
                this.database.transaction(function(transaction) {
                    transaction.executeSql('select value from data where key = ?', [key], function(transaction, results) {
                        if (results.rows.length) {
                            var row = results.rows.item(0);
                            callback(JSON.parse(row['value']));
                        } else {
                            callback(null);
                        }
                    }, function(error) {
                        callback(null);
                    });
                });
                break;
            case STStorage.LOCAL:
                var value = window.localStorage[key]
                callback(value ? JSON.parse(value) : null);
                break;
            default:
                callback(null);
                break;
        }
    },
    
    each: function(callback)
    {
        switch(this.storageType) {
            case STStorage.DATABASE:
                this.database.transaction(function(transaction) {
                    transaction.executeSql('select key, value from data', null, function(transaction, results) {
                        if (results.rows.length) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var row = results.rows.item(i);
                                try {
                                    var json = JSON.parse(row.value);
                                    callback(row.key, json);
                                } catch (e) {
                                    callback(row.key, null);
                                }
                            }
                        }
                    });
                });
                break;
            case STStorage.LOCAL:
                if (window.localStorage.length) {
                    for (var i = 0; i < window.localStorage.length; i++) {
                        var key = window.localStorage.key(i);
                        var value = window.localStorage[key];
                        try {
                            var json = JSON.parse(value);
                            callback(key, json);
                        } catch (e) {
                            callback(key, null);
                        }
                    }
                }
                break;
        }
    },
    
    remove: function(key)
    {
        switch(this.storageType) {
            case STStorage.DATABASE:
                this.database.transaction(function(transaction) {
                    transaction.executeSql('delete from data where key = ?', [key]);
                });
                break;
            case STStorage.LOCAL:
                this.changesMade++;
                delete window.localStorage[key];
                break;
        }
    },
    
    removeAll: function()
    {
        switch(this.storageType) {
            case STStorage.DATABASE:
                this.database.transaction(function(transaction) {
                    transaction.executeSql('delete from data');
                });
                break;
            case STStorage.LOCAL:
                this.changesMade++;
                window.localStorage.clear();
                break;
        }
    },
    
end
:0});