/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/View

// Base class for fields that are compatible with ST.Form
//
// Child classes must declare the following methods:
//   inputHTML: Return HTML code for the input element
//   convertValue: Convert a value to the correct format
//   getInputValue: Return the current value of the input element
//   setInputValue(value): Update the input element with a new value

ST.class('FieldView', 'View', function() {
  this.initializer(function() {
    this.super();
    this._value = this.convertValue(null);
    this._inputElement = null;
    return this._id = null;
  });
  
  this.property('value');
  this.property('inputElement');
  this.property('id');
  this.property('label');
  this.accessor('inputValue');

  this.method('setValue', function(newValue) {
    const oldValue = this._value;
    this._value = this.convertValue(newValue);
    if (this._loaded) { this.inputValue(this._value); }
    return this._changed('value', oldValue, this._value);
  });
  
  this.method('render', function() {
    this._inputElement = $(this.inputHTML());
    if (this._id) { this._inputElement.attr('id', this._id); }
    this.inputValue(this._value);
    this._inputElement.bind('click keyup change', this.method('inputChanged'));
    return this.element().append(this._inputElement);
  });
    
  this.method('focus', function() {
    if (this._loaded) {
      const input = this._inputElement[0];
      if (input && input.focus) {
        input.focus();
        return input.select();
      }
    }
  });
  
  this.method('blur', function() {
    if (this._loaded) {
      const input = this._inputElement[0];
      if (input && input.blur) { return input.blur(); }
    }
  });
  
  this.method('inputChanged', function() {
    const oldValue = this._value;
    const newValue = this.inputValue();
    if (oldValue !== newValue) {
      this._value = newValue;
      return this._changed('value', oldValue, newValue);
    }
  });
  
  this.method('_idChanged', function(oldValue, newValue) {
    if (this._loaded) { return this._inputElement.attr('id', newValue); }
  });
  
  return this.method('_valueChanged', function(oldValue, newValue) {
    return this.trigger('valueChanged', newValue);
  });
});