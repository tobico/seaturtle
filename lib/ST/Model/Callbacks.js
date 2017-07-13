import { ucFirst } from '../../util/uc-first'

export const Callbacks = (def) => {
  def.classMethod('callback', function(name) {
    const ucName = ucFirst(name);
    this.classMethod(`before${ucName}`, function(method) {
      if (!this[`_before${ucName}`]) { this[`_before${ucName}`] = []; }
      return this[`_before${ucName}`].push(method);
    });
    return this.classMethod(`after${ucName}`, function(method) {
      if (!this[`_after${ucName}`]) { this[`_after${ucName}`] = []; }
      return this[`_after${ucName}`].push(method);
    });
  });
  
  def.method('callBefore', function(name) {
    return this.callCallbacks(this._class[`_before${ucFirst(name)}`]);
  });
  
  def.method('callAfter', function(name) {
    return this.callCallbacks(this._class[`_after${ucFirst(name)}`]);
  });
  
  def.method('callCallbacks', function(callbacks) {
    if (callbacks && callbacks.length) {
      return Array.from(callbacks).map((callback) =>
        callback.call ?
          callback.call(this)
        :
          this[callback]());
    }
  });
}
