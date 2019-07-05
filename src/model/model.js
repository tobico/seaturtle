import jQuery from 'jquery'

import { BaseModel } from './base-model'

export const Model = {
  _notFound: {},
  _generateUUID: function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)},
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
      if (additionalData) { jQuery.extend(data, additionalData); }
      jQuery.ajax({
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
      if (delegate && delegate.onConnectionError) { delegate.onConnectionError(status); }
    });
    this.onSyncStart((count) => {
      if (delegate.onSyncStart) { delegate.onSyncStart(count); }
    });
    this.onSyncComplete(() => {
      if (delegate.onSyncComplete) { delegate.onSyncComplete(); }
    });
    this.onFatalError((status) => {
      if (delegate.onFatalError) { delegate.onFatalError(status); }
    });
    this.onSyncError((errors) => {
      if (delegate.onSyncError) { delegate.onSyncError(errors); }
    });

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
      Object.keys(data.ack).forEach(id => {
        const status = data.ack[id];
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
      })
      Object.keys(this._changes).forEach(id => {
        if (this._changes[id].submitted) {
          this._changes[id].submitted = false;
          errors.push(`Failed to submit change with id ${id}`)
        }
      })
    } else {
      errors.push('No "Ack" field in server response')
    }

    if (errors.length > 0) {
      if (this._onSyncError) { this._onSyncError(errors); }
      return false
    } else {
      if (this._changesCount) {
        if (this._onSyncContinue) { this._onSyncContinue(); }
      } else {
        if (this._onSyncComplete) { this._onSyncComplete(); }
      }
      return true;
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
