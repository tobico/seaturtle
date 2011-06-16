#require ST/Object

ST.class 'Storage', ->
  @singleton()
  
  @classMethod 'supported', ->
    !!(window.openDatabase || window.localStorage)
  
  @initializer (storage='auto') ->
    @super()

    if storage == 'database' || (storage == 'auto' && window.openDatabase)
      try
        @_database = window.openDatabase 'ststorage', '1.0', 'STStorage Data Store', 10485760
        @_database.transaction (transaction) ->
          transaction.executeSql 'create table data(`key` text not null primary key, `value` text not null)'
        @_storageType = 'database'
      catch e
        @_storageType = 'none'
    else if storage == 'local' || (storage == 'auto' && window.localStorage)
      @_storageType = 'local'
      
      storageEvent = @method 'storageEvent'
      $ ->
        if $.browser.safari
          window.addEventListener 'storage', storageEvent, false
        else
          $(document).bind 'storage', storageEvent
      @_changesMade = 1
      
      # Make a dummy change, to catch out any other instances of
      # ST.Storage on the same data store
      localStorage.removeItem 'storageTest'
    else
      @_storageType = 'none'
  
  @property 'storageType'
  
  @method 'isActive', ->
    @_storageType != 'none'
  
  @method 'storageEvent', (evt) ->
    if @_changesMade > 0
      @_changesMade--
    else
      @trigger 'externalChange', evt
  
  @method 'set', (key, value) ->
    self = this
    
    json = JSON.stringify value
    
    switch @_storageType
      when 'database'
        @_database.transaction (transaction) ->
          transaction.executeSql 'insert into data (key, value) values (?, ?)', [key, json]
        , ->
          self._database.transaction (transaction) ->
            transaction.executeSql 'update data set value = ? where key = ?', [json, key]
      when 'local'
        @_changesMade++
        localStorage.setItem key, json
  
  @method 'fetch', (key, callback) ->
    switch @_storageType
      when 'database'
        @_database.transaction (transaction) ->
          transaction.executeSql 'select value from data where key = ?', [key], (transaction, results) ->
            if results.rows.length
              row = results.rows.item 0
              callback JSON.parse(row['value'])
            else
              callback null
          , (error) ->
            callback null
      when 'local'
        value = localStorage[key]
        if value
          callback JSON.parse(value)
        else
          callback null
      else
        callback null
  
  @method 'each', (callback) ->
    switch @_storageType
      when 'database'
        @_database.transaction (transaction) ->
          transaction.executeSql 'select key, value from data', null, (transaction, results) ->
            index = 0
            while index < results.rows.length
              row = results.rows.item index++
              try
                json = JSON.parse row.value
                callback row.key, json
              catch e
                callback row.key, null
      when 'local'
        for key in localStorage
          value = localStorage[key]
          try
            json = JSON.parse value
            callback key, json
          catch e
            callback key, null
  
  @method 'remove', (key) ->
    switch @_storageType
      when 'database'
        @_database.transaction (transaction) ->
          transaction.executeSql 'delete from data where key = ?', [key]
      when 'local'
        @_changesMade++
        delete localStorage[key]
  
  @method 'removeAll', ->
    switch @_storageType
      when 'database'
        @_database.transaction (transaction) ->
          transaction.executeSql 'delete from data'
      when 'local'
        @_changesMade++
        localStorage.clear()