/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/View

ST.class('EnumFieldView', 'View', function() {
  this.initializer('withValuesNull', function(values, allowNull) {
    this.init();
    this._value = allowNull ? null : values[0][1];
    this._allowNull = !!allowNull;
    this._values = values;
    this._valueIndex = {};
    this._selectElement = null;
    return this._id = null;
  });
  
  this.property('value');
  this.property('values');
  this.property('selectElement');
  this.property('id');
  this.property('label');
  this.property('allowNull');
  
  this.method('isValueValid', function(value) {
    if (value === null) {
      return this._allowNull;
    } else {
      for (let option of Array.from(this._values)) {
        if (option[1] === value) { return true; }
      }
      return false;
    }
  });
  
  this.method('render', function() {
    this._selectElement = $('<select />');
    if (this._id) { this._selectElement.attr('id', this._id); }
    this.renderOptions();
    this._selectElement.bind('keyup change', this.method('selectChanged'));
    return this.element().append(this._selectElement);
  });
  
  this.method('renderOptions', function() {
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
  
  this.method('selectChanged', function(e) {
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
  
  this.method('setValue', function(newValue) {
    if (this.isValueValid(newValue)) {
      this._value = newValue;
      if (this._skipUpdate) {
        return this._skipUpdate = false;
      } else if (this._loaded) {
        return this._selectElement[0].selectedIndex = (this._valueIndex[newValue] != null) ? this._valueIndex[newValue] : 0;
      }
    }
  });
  
  this.method('_valuesChanged', function(oldValues, newValues) {
    if (!this.isValueValid(this.value())) { this.value(null); }
    if (this._loaded) { return this.renderOptions(); }
  });
  
  return this.method('_idChanged', function(oldValue, newValue) {
    if (this._loaded) { return this._selectElement.attr('id', newValue); }
  });
});