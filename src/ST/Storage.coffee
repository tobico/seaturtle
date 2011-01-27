ST.class 'Storage', ->
  @NONE = 0
  @DATABASE = 1
  @LOCAL = 2
  
  @Supported = -> window.openDatabase || window.localStorage
  
  @singleton()
  
  @constructor ->
    self = this
    
    @storageType = ST.Storage.NONE
    
    if window.openDatabase
      try
        @database = window.openDatabase 'ststorage', '1.0', 'STStorage Data Store', 10485760
        @database.transaction (transaction) ->
          transaction.executeSql 'create table data(`key` text not null primary key, `value` text not null)'
        @storageType = ST.Storage.DATABASE
      catch e
        @storageType = ST.Storage.NONE
    else if window.localStorage
      @storageType = ST.Storage.LOCAL
    
    if window.localStorage
      $ ->
        if $.browser.safari
          window.addEventListener 'storage', self.methodFn('storageEvent'), false
        else
          $(document).bind 'storage', self.methodFn('storageEvent')
      @changesMade = 1;
      
      # Make a dummy change, to catch out any other instances of
      # ST.Storage on the same data store
      window.localStorage.removeItem 'storageTest'
  
  @method 'isActive', ->
    @storageType != STStorage.NONE
  
  @method 'storageEvent', (evt) ->
    if @changesMade > 0
      @changesMade--
    else
      @trigger 'externalChange', evt
  
  @method 'set', (key, value) ->
    self = this
    
    json = JSON.stringify value
    
    switch @storageType
      when ST.Storage.DATABASE
        @database.transaction (transaction) ->
          transaction.executeSql 'insert into data (key, value) values (?, ?)', [key, json]
        , ->
          self.database.transaction (transaction) ->
            transaction.executeSql 'update data set value = ? where key = ?', [json, key]
      when ST.Storage.LOCAL
        @changesMade++
        window.localStorage.setItem key, json
  
  @method 'fetch', (key, callback) ->
    switch @storageType
      when ST.Storage.DATABASE
        @database.transaction (transaction) ->
          transaction.executeSql 'select value from data where key = ?', [key], (transaction, results) ->
            if results.rows.length
              row = results.rows.item 0
              callback JSON.parse(row['value'])
            else
              callback null
          , (error) ->
            callback null
      when ST.Storage.LOCAL
        value = window.localStorage[key]
        if value
          callback JSON.parse(value)
        else
          callback null
      else
        callback null
  
  @method 'each', (callback) ->
    switch @storageType
      when ST.Storage.DATABASE
        @database.transaction (transaction) ->
          transaction.executeSql 'select key, value from data', null, (transaction, results) ->
            if results.rows.length
              for row in rows
                try
                  json = JSON.parse row.value
                  callback row.key, json
                catch e
                  callback row.key, null
      when ST.Storage.LOCAL
        if window.localStorage.length
          for key, value in window.localStorage
            try
              json = JSON.parse value
              callback key, json
            catch e
              callback key, null
  
  @method 'remove', (key) ->
    switch @storageType
      when ST.Storage.DATABASE
        @database.transaction (transaction) ->
          transaction.executeSql 'delete from data where key = ?', [key]
      when ST.Storage.LOCAL
        @changesMade++
        delete window.localStorage[key]
  
  @method 'removeAll', ->
    switch @storageType
      when ST.Storage.DATABASE
        @database.transaction (transaction) ->
          transaction.executeSql 'delete from data'
      when ST.Storage.LOCAL
        @changesMade++;
        window.localStorage.clear()