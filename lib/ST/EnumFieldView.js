import * as $ from 'jquery'

import { makeClass } from '../util/make-class'
import { View } from './View'

export const EnumFieldView = makeClass(View, (def) => {
  def.initializer('withValuesNull', function(values, allowNull) {
    this.init();
    this._value = allowNull ? null : values[0][1];
    this._allowNull = !!allowNull;
    this._values = values;
    this._valueIndex = {};
    this._selectElement = null;
    return this._id = null;
  });
  
  def.property('value');
  def.property('values');
  def.property('selectElement');
  def.property('id');
  def.property('label');
  def.property('allowNull');
  
  def.method('isValueValid', function(value) {
    if (value === null) {
      return this._allowNull;
    } else {
      for (let option of Array.from(this._values)) {
        if (option[1] === value) { return true; }
      }
      return false;
    }
  });
  
  def.method('render', function() {
    this._selectElement = $('<select />');
    if (this._id) { this._selectElement.attr('id', this._id); }
    this.renderOptions();
    this._selectElement.bind('keyup change', this.method('selectChanged'));
    return this.element().append(this._selectElement);
  });
  
  def.method('renderOptions', function() {
    let index = 1;
    const html = [];
    if (this._allowNull) {
      html.push('<option value=""');
      if (this._value === null) { html.push(' selected="selected"'); }
      html.push('></option>');
    }
    for (let option of Array.from(this._values)) {
      html.push('<option value="', option[1], '"');
      if (this._value === option[1]) { html.push(' selected="selected"'); }
      html.push('>', option[0], '</option>');
      this._valueIndex[option[1]] = index++;
    }
    return this._selectElement.html(html.join(''));
  });
  
  def.method('selectChanged', function(e) {
    if (e && e.which && (e.which === 13)) {
      return this.trigger('submit');
    } else {
      const oldValue = this._value;
      const option = this._selectElement[0].options[this._selectElement[0].selectedIndex];
      const newValue = option && option.value.length ? option.value : null;
      if (oldValue !== newValue) {
        this._skipUpdate = true;
        return this.value(newValue);
      }
    }
  });
  
  def.method('setValue', function(newValue) {
    if (this.isValueValid(newValue)) {
      this._value = newValue;
      if (this._skipUpdate) {
        return this._skipUpdate = false;
      } else if (this._loaded) {
        return this._selectElement[0].selectedIndex = (this._valueIndex[newValue] != null) ? this._valueIndex[newValue] : 0;
      }
    }
  });
  
  def.method('_valuesChanged', function(oldValues, newValues) {
    if (!this.isValueValid(this.value())) { this.value(null); }
    if (this._loaded) { return this.renderOptions(); }
  });
  
  def.method('_idChanged', function(oldValue, newValue) {
    if (this._loaded) { return this._selectElement.attr('id', newValue); }
  });
});
