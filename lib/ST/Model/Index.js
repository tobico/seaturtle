import { BaseObject } from '../BaseObject'
import { makeClass } from '../../util/make-class'
import { List } from '../List'

export const Index = makeClass(BaseObject, (def) => {
  def.initializer('withModelAttribute', function(model, attribute) {
    this.init();
    this._model = model;
    this._attribute = attribute;
    this._values = {};
    return this._cardinality = 0;
  });

  def.property('cardinality', 'read');

  def.method('get', function(value) {
    const key = String(value);
    if (!this._values[key]) {
      this._values[key] = List.create();
      this._cardinality++;
    }
    return this._values[key];
  });

  def.method('add', function(value, item) {
    return this.get(value).add(item);
  });

  def.method('remove', function(value, item) {
    let list;
    const key = String(value);
    if (list = this._values[key]) {
      list.remove(item);
      if (list.isEmpty() && !list.isBound()) {
        delete this._values[key];
        return this._cardinality--;
      }
    }
  });
});
