import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { BaseView } from './base-view'

const makeOption = (value, label, selected) => (
  `<option value="${value}"${selected ? ' selected' : ''}>${label}</option>`
)

const customPlaceholder = '__(custom)__'

export const EnumFieldView = makeClass('EnumFieldView', BaseView, (def) => {
  def.initializer('withValues', function(values, options) {
    this.init();

    this._values = values;

    this._nullOption = options.null || false;
    if (this._nullOption === true) { this._nullOption = ''; }
    this._customOption = options.custom || false;
    if (this._customOption === true) { this._customOption = 'Custom'; }

    this._value = this.hasNullOption() ? null : values[0][1];
    this._selectElement = null;
    this._id = null;
  });
  
  def.property('value');
  def.property('values');
  def.property('selectElement');
  def.property('inputElement');
  def.property('id');
  def.property('label');
  def.property('nullOption');
  def.property('customOption');
  
  def.method('isValueValid', function(value) {
    if (this.hasCustomOption()) {
      return true;
    } else if (value === null) {
      return this.hasNullOption();
    } else {
      return this.isValueInList(value);
    }
  });

  def.method('isValueInList', function(value) {
    for (let option of Array.from(this._values)) {
      if (option[1] === value) { return true; }
    }
    return false;
  })

  def.method('isValueCustom', function(value) {
    return (value !== null && !this.isValueInList(value));
  });

  def.method('hasNullOption', function() {
    return this.nullOption() !== false;
  });
  
  def.method('hasCustomOption', function() {
    return this.customOption() !== false;
  });

  def.method('render', function() {
    this._selectElement = jQuery('<select />');
    if (this._id) { this._selectElement.attr('id', this._id); }
    this.renderOptions();
    this._selectElement.bind('keyup change', this.method('selectChanged'));
    this.element().append(this._selectElement);

    if (this.hasCustomOption()) {
      this._inputElement = jQuery('<input>')
        .val(this._value)
        .bind('keyup change', this.method('inputChanged'))
        .appendTo(this.element());
      this.updateInputVisible();
    }
  });
  
  def.method('renderOptions', function() {
    let index = 1;
    const html = [];
    if (this.hasNullOption()) {
      html.push(makeOption('', this.nullOption(), this._value === null));
    }
    for (let option of Array.from(this._values)) {
      html.push(makeOption(option[1], option[0], this._value === option[1]));
    }
    if (this.hasCustomOption()) {
      html.push(makeOption(customPlaceholder, this.customOption(), this.isValueCustom(this._value)));
    }
    return this._selectElement.html(html.join(''));
  });

  def.method('getSelectedOption', function() {
    return this._selectElement[0].options[this._selectElement[0].selectedIndex];
  });

  def.method('setSelectedOption', function(value) {
    let found = false;
    this._selectElement.find('option').each(function() {
      if (jQuery(this).val() == value) {
        found = true;
        jQuery(this).prop("selected", true);
      }
    })
    if (!found) { this._selectElement[0].selectedIndex = 0; }
  });
  
  def.method('selectChanged', function(e) {
    if (e && e.which && (e.which === 13)) {
      this.trigger('submit');
      return;
    }
    
    this.updateInputVisible();

    const oldValue = this._value;
    const option = this.getSelectedOption();
    let newValue = option && option.value.length ? option.value : null;
    if (newValue === customPlaceholder) {
      newValue = this.isValueCustom(oldValue) ? oldValue : '';
      this._inputElement.focus();
    }

    if (oldValue !== newValue) {
      this._skipUpdate = true;
      this.value(newValue);
      if (this._inputElement) {
        this._inputElement.val(newValue);
      }
    }
  });


  def.method('updateInputVisible', function() {
    if (this._inputElement) {
      this._inputElement.toggle(this._selectElement.val() == customPlaceholder);
    }
  });

  def.method('inputChanged', function(e) {
    if (e && e.which && (e.which === 13)) {
      this.trigger('submit');
      return;
    }

    const oldValue = this._value;
    const newValue = this._inputElement.val();
    if (oldValue !== newValue) {
      this._skipUpdate = true;
      this.value(newValue);
    }
    this.updateInputVisible();
  })
  
  def.method('setValue', function(newValue) {
    if (this.isValueValid(newValue)) {
      this._value = newValue;
      if (this._skipUpdate) {
        return this._skipUpdate = false;
      } else if (this._loaded) {
        if (this.isValueCustom(newValue)) {
          this._inputElement.val(newValue);
          this.setSelectedOption(customPlaceholder);
        } else {
          this.setSelectedOption(newValue);
        }
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
