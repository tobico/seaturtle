/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Object

ST.module('Model', function() {
  return this.class('Index', function() {
    this.initializer('withModelAttribute', function(model, attribute) {
      this.init();
      this._model = model;
      this._attribute = attribute;
      this._values = {};
      return this._cardinality = 0;
    });
  
    this.property('cardinality', 'read');

    this.method('get', function(value) {
      const key = String(value);
      if (!this._values[key]) {
        this._values[key] = ST.List.create();
        this._cardinality++;
      }
      return this._values[key];
  });
  
    this.method('add', function(value, item) {
      return this.get(value).add(item);
    });

    return this.method('remove', function(value, item) {
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
});