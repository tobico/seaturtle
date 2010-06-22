STObject.subClass('STStorage', {
    NONE: 0,
    DATABASE: 1,
    LOCAL: 2,
    
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
            window.localStorage.setItem('storageTest', 'test');
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
                break
            case STStorage.LOCAL:
                var value = window.localStorage[key]
                callback(value ? JSON.parse(value) : null);
                break;
            default:
                callback(null);
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
    
end
:0});