import * as $ from 'jquery'

import { BaseModel } from './Model/BaseModel'

export const Model = {
  _byUuid: {},
  _notFound: {},
  _generateUUID: Math.uuid || (function() { if (!this.NextUUID) { this.NextUUID = 0; } return this.NextUUID++; }),
  _storage: null,
  _changes: {},
  _changesCount: 0,
  _changeID: 1,
  _lastChange: null,
  
  recordChange(type, uuid, model, data) {    
    // If the last change made was also an update to this model, and it hasn't
    // been submitted yet, amend the previous update with additional data
    // instead of making a new one
    if ((type === 'update') && this._lastChange && (this._lastChange.type === 'update') && (this._lastChange.uuid === uuid) && !this._lastChange.submitted) {
      for (let attribute in data) {
        if (data.hasOwnProperty(attribute)) {
          this._lastChange.data[attribute] = data[attribute];
        }
      }
    } else {
      const change = {
        type,
        uuid,
        model,
        submitted:  false
      };
      if (data) { change.data = data; }
      this._changes[this._changeID++] = change;
      this._changesCount++;
      this._lastChange = change;
      if (this._onHasChanges) { this._onHasChanges(this._changesCount); }
    }
    return true;
  },
  
  sync(url, async, additionalData=null) {
    if ((this._changesCount > 0) && !this._submitting) {
      this._submitting = true;
      if (this._onSyncStart) { this._onSyncStart(this._changesCount); }
      for (let id in this._changes) {
        if (this._changes.hasOwnProperty(id)) {
          this._changes[id].submitted = true;
        }
      }
      const data = {changes: JSON.stringify(this._changes)};
      if (additionalData) { $.extend(data, additionalData); }
      $.ajax({
        url,
        type:     'post',
        async,
        data,
        success:  data => {
          this._submitting = false;
          if (data.fatal) {
            if (this._onFatalError) { return this._onFatalError(data.fatal); }
          } else {
            return this.ackSync(data);
          }
        },
        error: (xhr, status) => {
          this._submitting = false;
          if (this._onConnectionError) { return this._onConnectionError(status); }
        }
      });
      return true;
    } else {
      return false;
    }
  },
  
  autoSync(url, delegate=null, syncBeforeUnload) {
    if (syncBeforeUnload == null) { syncBeforeUnload = false; }
    window.sync = async => Model.sync(url, async);
    
    this.onSyncContinue(() => sync(true));
    this.onConnectionError(function(status) {
      setTimeout(() => sync(true)
      , 5000);
      if (delegate && delegate.onConnectionError) { return delegate.onConnectionError(status); }
    });
    this.onSyncStart(function(count) { if (delegate.onSyncStart) { return delegate.onSyncStart(count); } });
    this.onSyncComplete(function() { if (delegate.onSyncComplete) { return delegate.onSyncComplete(); } });
    this.onFatalError(function(status) { if (delegate.onFatalError) { return delegate.onFatalError(status); } });
    this.onSyncError(function() { if (delegate.onSyncError) { return delegate.onSyncError(); } });
    
    this.onHasChanges(() => setTimeout((() => sync(true)), 100));
    
    if (syncBeforeUnload) {
      window.onbeforeunload = function(e) {
        const ev = e || window.event;
        const msg = (() => {
          if (window.Connection && !Connection.active) {
          return options.unsavedWarning || 'Unable to save your changes to the server. If you leave now, you will lose your changes.';
        } else if (Model._submitting) {
          return options.savingWarning || 'Currently writing your changes to the server. If you leave now, you will lose your changes.';
        } else {
          sync(false);
          return undefined;
        }
        })();
        
        if (ev && msg) { ev.returnValue = msg; }
        return msg;
      };
      
      window.forceReload = function() {
        window.onbeforeunload = () => null;
        return location.reload(true);
      };
    }
    
    return sync;
  },
  
  ackSync(data) {
    const errors = [];
    if (data.ack) {
      for (var id in data.ack) {
        const status = data.ack[id];
        if (data.ack.hasOwnProperty(id)) {
          const change = this._changes[id];
          if (status === 'ok') {
            delete this._changes[id];
            this._changesCount--;
          } else if (status === 'notfound') {
            errors.push(`${change.model} with UUID ${change.uuid} not found`);
          } else if (status === 'unauthorized') {
            errors.push(`Access denied to ${change.model} with UUID ${change.uuid}`);
          } else if (status === 'exists') {
            errors.push(`${change.model} with UUID ${change.uuid} already exists`);
          } else if (status === 'invalid') {
            const base = `${change.model} with UUID ${change.uuid} failed to validate`;
            if (data.errors[id]) {
              for (let number in data.errors[id]) {
                const message = data.errors[id][number];
                errors.push(`${base} with message ${message}`);
              }
            } else {
              errors.push(base);
            }
          }
        }
      }
      for (id in this._changes) {
        if (this._changes.hasOwnProperty(id) && this._changes[id].submitted) {
          this._changes[id].submitted = false;
          if (this._onSyncError) { this._onSyncError(errors); }
          return false;
        }
      }
      if (this._changesCount) {
        if (this._onSyncContinue) { this._onSyncContinue(); }
      } else {
        if (this._onSyncComplete) { this._onSyncComplete(); }
      }
      return true;
    } else {
      if (this._onSyncError) { this._onSyncError(errors); }
      return false;
    }
  },
  
  // Event handler - called when changes are available to sync
  onHasChanges(fn) {
    return this._onHasChanges = fn;
  },

  // Event handler - called when a sync request starts
  onSyncStart(fn) {
    return this._onSyncStart = fn;
  },

  // Event handler - called when sync request finishes, but there are new changes
  onSyncContinue(fn) {
    return this._onSyncContinue = fn;
  },

  // Event handler - called when sync request finishes and there are no new changes
  onSyncComplete(fn) {
    return this._onSyncComplete = fn;
  },

  // Event handler - called when individual changes fail to save with an error
  onSyncError(fn) {
    return this._onSyncError = fn;
  },
  
  // Event handler - called when a connection to the save URL could not be made
  onConnectionError(fn) {
    return this._onConnectionError = fn;
  },

  // Event handler - called when a save request fails completely
  onFatalError(fn) {
    return this._onFatalError = fn;
  },

  changes() {
    return this._changesCount;
  },

  storage(newStorage) {
    const self = this;
    if (newStorage != null) {
      this.Storage = storage;
      
      if (newStorage) {
        // Save any existing models to new storage
        for (let object of Array.from(this._byUuid)) {
          object.persist();
        }

        // Load any unloaded saved models from storage
        return storage.each(function(key, value) {
          if (value && value.model && window[value.model] && !self._byUuid[key]) {
            let model;
            return model = BaseModel.createWithData(value);
          }
        });
      }
    } else {
      return this.Storage;
    }
  }
};
