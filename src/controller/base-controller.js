import { Destructable } from '../core/destructable'
import { makeClass } from '../core/make-class'

export const BaseController = makeClass('BaseController', Destructable, (def) => {
  def.retainedProperty('view');
  
  def.method('_viewChanged', function(oldValue, newValue) {
    if (oldValue) { oldValue.unbindAll(this); }
    if (newValue) { newValue.bind('loaded', this, 'viewLoaded'); }
    if (newValue) { return newValue.bind('unloaded', this, 'viewUnloaded'); }
  });
  
  def.method('viewLoaded', function() {});
  def.method('viewUnloaded', function() {});
});
