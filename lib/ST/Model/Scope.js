import * as $ from 'jquery'

import { List } from '../List'
import { makeClass } from '../../util/make-class'

export const Scope = makeClass(List, (def) => {
  def.initializer('withModel', function(model) {
    this.init();
    this._model = model;
    this._conditions = [];
    this._orders = null;
    return this._populated = false;
  });

  def.initializer('withScope', function(scope) {
    this.init();
    this._model = scope._model;
    this._conditions = scope._conditions && scope._conditions.slice(0);
    this._orders = scope._orders && scope._orders.slice(0);
    return this._populated = false;
  });

  def.property('model', 'read');

  def.method('fork', function(block) {
    const scope = this._class.createWithScope(this);
    if (block) { block.call(scope); }
    return scope;
  });
  
  def.method('where', function(...conditions) {
    return this.fork(function() {
      return Array.from(conditions).map((condition) =>
        this._conditions.push(condition));
    });
  });

  def.method('order', function(...orders) {
    return this.fork(function() {
      if (!this._orders) { this._orders = []; }
      return (() => {
        const result = [];
        for (let order of Array.from(orders)) {
          var found;
          if (found = order.match(/^(\w+) (desc|asc)$/i)) {
            order = found[1];
            if (found[2].toLowerCase() === 'desc') { order = {reverse: order}; }
          }
          result.push(this._orders.push(order));
        }
        return result;
      })();
    });
  });
  
  def.method('index', function() {
    if (!this._index) {
      this._index = this._model.master();
      
      if (this._model._indexes) {
        let cardinality = -1;
        for (let condition of Array.from(this._conditions)) {
          if (condition.type === 'equals') {
            var index;
            if (index = this._model._indexes[condition.attribute]) {
              if (index.cardinality() > cardinality) {
                this._index = index.get(condition.value);
                cardinality = index.cardinality();
              }
            }
          }
        }
      }
    }
    return this._index;
  });

  def.method('addBindings', function() {
    if (!this._bindingsAdded) {
      this.index().bind('itemAdded',   this, 'targetItemAdded');
      this.index().bind('itemRemoved', this, 'targetItemRemoved');
      return this._bindingsAdded = true;
    }
  });

  def.method('removeBindings', function() {
    if (this._bindingsAdded) {
      this.index().unbindAll(this);
      return this._bindingsAdded = false;
    }
  });

  def.method('bind', function(trigger, receiver, selector) {
    this.populate();
    this.addBindings();
    return this.super(trigger, receiver, selector);
  });

  def.method('unbindAll', function(receiver) {
    this.super(receiver);
    if (!this.isBound()) { return this.removeBindings(); }
  });

  def.method('each', function(callback) {
    this.populate();
    return this.super(callback);
  });

  def.method('count', function() {
    this.populate();
    return this.super();
  });
  
  def.method('sort', function() {
    if (this._orders) {
      const orders = this._orders;
      return this._array.sort(function(a, b) {
        for (let attribute of Array.from(orders)) {
          var a_value, b_value;
          if (attribute.reverse) {
            a_value = b.get(attribute.reverse);
            b_value = a.get(attribute.reverse);
          } else {
            a_value = a.get(attribute);
            b_value = b.get(attribute);
          }
          if (a_value > b_value) { return 1; }
          if (a_value < b_value) { return -1; }
        }
        return 0;
      });
    }
  });
  
  def.method('populate', function() {
    if (!this._populated && !this._array.length) {
      this._populated = true;
      
      const self = this;
      this.index().each(function(candidate) {
        if (candidate.matches(self._conditions)) { return self.add(candidate); }
      });
      
      return this.sort();
    }
  });
  
  def.method('forgetAll', function(destroy) {
    if (destroy == null) { destroy = false; }
    return (() => {
      let item;
      const result = [];
      while ((item = this.first())) {
        item.forget(destroy);
        result.push(this.remove(item));
      }
      return result;
    })();
  });
  
  def.method('destroyAll', function() {
    return this.forgetAll(true);
  });
  
  def.method('build', function(data) {
    const defaults = {};
    for (let condition of Array.from(this._conditions)) {
      if (condition.attribute && condition.value) {
        defaults[condition.attribute] = condition.value;
      }
    }
    if (data) { $.extend(defaults, data); }
    return this._model.createWithData(defaults);
  });

  def.method('search', function(keywords, limit) {
    const conditions = this._conditions;
    return this._model.search(keywords, {limit, filter(item) {
      return item.matches(conditions);
    }
    });
  });

  def.method('targetItemAdded', function(target, item) {
    if (item.matches(this._conditions)) { this.add(item); }
    return this.sort();
  });

  def.method('targetItemRemoved', function(target, item) {  
    return this.remove(item);
  });
});
