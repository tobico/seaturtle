/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Destructable

ST.class('Controller', 'Destructable', function() {
  this.retainedProperty('view');
  
  this.method('_viewChanged', function(oldValue, newValue) {
    if (oldValue) { oldValue.unbindAll(this); }
    if (newValue) { newValue.bind('loaded', this, 'viewLoaded'); }
    if (newValue) { return newValue.bind('unloaded', this, 'viewUnloaded'); }
  });
  
  this.method('viewLoaded', function() {});
  return this.method('viewUnloaded', function() {});
});