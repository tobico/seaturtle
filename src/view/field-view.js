import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { BaseView } from './base-view'

export const FieldView = makeClass('FieldView', BaseView, (def) => {
  def.initializer(function() {
    this.super();
    this._value = this.convertValue(null);
    this._inputElement = null;
    return this._id = null;
  });
  
  def.property('value');
  def.property('inputElement');
  def.property('id');
  def.property('label');
  def.accessor('inputValue');

  def.method('setValue', function(newValue) {
    const oldValue = this._value;
    this._value = this.convertValue(newValue);
    if (this._loaded) { this.inputValue(this._value); }
    return this._changed('value', oldValue, this._value);
  });
  
  def.method('render', function() {
    this._inputElement = jQuery(this.inputHTML());
    if (this._id) { this._inputElement.attr('id', this._id); }
    this.inputValue(this._value);
    this._inputElement.bind('click keyup change', this.method('inputChanged'));
    return this.element().append(this._inputElement);
  });
    
  def.method('focus', function() {
    if (this._loaded) {
      const input = this._inputElement[0];
      if (input && input.focus) {
        input.focus();
        return input.select();
      }
    }
  });
  
  def.method('blur', function() {
    if (this._loaded) {
      const input = this._inputElement[0];
      if (input && input.blur) { return input.blur(); }
    }
  });
  
  def.method('inputChanged', function() {
    const oldValue = this._value;
    const newValue = this.inputValue();
    if (oldValue !== newValue) {
      this._value = newValue;
      return this._changed('value', oldValue, newValue);
    }
  });
  
  def.method('_idChanged', function(oldValue, newValue) {
    if (this._loaded) { return this._inputElement.attr('id', newValue); }
  });
  
  def.method('_valueChanged', function(oldValue, newValue) {
    return this.trigger('valueChanged', newValue);
  });
});
