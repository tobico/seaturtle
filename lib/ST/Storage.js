import * as $ from 'jquery'

import { makeClass } from '../util/make-class'
import { BaseObject } from './BaseObject'

export const Storage = makeClass(BaseObject, (def) => {
  def.singleton();
  
  def.classMethod('supported', () => !!(window.openDatabase || window.localStorage));
  
  def.initializer(function(storage) {
    if (storage == null) { storage = 'auto'; }
    this.super();

    if ((storage === 'database') || ((storage === 'auto') && window.openDatabase)) {
      try {
        this._database = window.openDatabase('ststorage', '1.0', 'STStorage Data Store', 10485760);
        this._database.transaction(transaction => transaction.executeSql('create table data(`key` text not null primary key, `value` text not null)'));
        return this._storageType = 'database';
      } catch (e) {
        return this._storageType = 'none';
      }
    } else if ((storage === 'local') || ((storage === 'auto') && window.localStorage)) {
      this._storageType = 'local';
      
      const storageEvent = this.method('storageEvent');
      $(function() {
        if ($.browser.safari) {
          return window.addEventListener('storage', storageEvent, false);
        } else {
          return $(document).bind('storage', storageEvent);
        }
      });
      this._changesMade = 1;
      
      // Make a dummy change, to catch out any other instances of
      // Storage on the same data store
      return localStorage.removeItem('storageTest');
    } else {
      return this._storageType = 'none';
    }
  });
  
  def.property('storageType');
  
  def.method('isActive', function() {
    return this._storageType !== 'none';
  });
  
  def.method('storageEvent', function(evt) {
    if (this._changesMade > 0) {
      return this._changesMade--;
    } else {
      return this.trigger('externalChange', evt);
    }
  });
  
  def.method('set', function(key, value) {
    const self = this;
    
    const json = JSON.stringify(value);
    
    switch (this._storageType) {
      case 'database':
        return this._database.transaction(transaction => transaction.executeSql('insert into data (key, value) values (?, ?)', [key, json])
        , () =>
          self._database.transaction(transaction => transaction.executeSql('update data set value = ? where key = ?', [json, key]))
      );
      case 'local':
        this._changesMade++;
        return localStorage.setItem(key, json);
    }
  });
  
  def.method('fetch', function(key, callback) {
    switch (this._storageType) {
      case 'database':
        return this._database.transaction(transaction =>
          transaction.executeSql('select value from data where key = ?', [key], function(transaction, results) {
            if (results.rows.length) {
              const row = results.rows.item(0);
              return callback(JSON.parse(row['value']));
            } else {
              return callback(null);
            }
          }
          , error => callback(null))
        );
      case 'local':
        const value = localStorage[key];
        if (value) {
          return callback(JSON.parse(value));
        } else {
          return callback(null);
        }
      default:
        return callback(null);
    }
  });
  
  def.method('each', function(callback) {
    switch (this._storageType) {
      case 'database':
        return this._database.transaction(transaction =>
          transaction.executeSql('select key, value from data', null, function(transaction, results) {
            let index = 0;
            return (() => {
              const result = [];
              while (index < results.rows.length) {
                const row = results.rows.item(index++);
                try {
                  const json = JSON.parse(row.value);
                  result.push(callback(row.key, json));
                } catch (e) {
                  result.push(callback(row.key, null));
                }
              }
              return result;
            })();
          })
        );
      case 'local':
        return (() => {
          const result = [];
          for (let key of Array.from(localStorage)) {
            const value = localStorage[key];
            try {
              const json = JSON.parse(value);
              result.push(callback(key, json));
            } catch (error) {
              const e = error;
              result.push(callback(key, null));
            }
          }
          return result;
        })();
    }
  });
  
  def.method('remove', function(key) {
    switch (this._storageType) {
      case 'database':
        return this._database.transaction(transaction => transaction.executeSql('delete from data where key = ?', [key]));
      case 'local':
        this._changesMade++;
        return delete localStorage[key];
    }
  });
  
  def.method('removeAll', function() {
    switch (this._storageType) {
      case 'database':
        return this._database.transaction(transaction => transaction.executeSql('delete from data'));
      case 'local':
        this._changesMade++;
        return localStorage.clear();
    }
  });
});
