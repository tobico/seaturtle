/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Object

ST.module('Model', function() {
  return this.module('Callbacks', function() {
    this.classMethod('callback', function(name) {
      const ucName = ST.ucFirst(name);
      this.classMethod(`before${ucName}`, function(method) {
        if (!this[`_before${ucName}`]) { this[`_before${ucName}`] = []; }
        return this[`_before${ucName}`].push(method);
      });
      return this.classMethod(`after${ucName}`, function(method) {
        if (!this[`_after${ucName}`]) { this[`_after${ucName}`] = []; }
        return this[`_after${ucName}`].push(method);
      });
    });
    
    this.method('callBefore', function(name) {
      return this.callCallbacks(this._class[`_before${ST.ucFirst(name)}`]);
  });
    
    this.method('callAfter', function(name) {
      return this.callCallbacks(this._class[`_after${ST.ucFirst(name)}`]);
  });
    
    return this.method('callCallbacks', function(callbacks) {
      if (callbacks && callbacks.length) {
        return Array.from(callbacks).map((callback) =>
          callback.call ?
            callback.call(this)
          :
            this[callback]());
      }
    });
  });
});