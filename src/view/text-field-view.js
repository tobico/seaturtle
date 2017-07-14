import { makeClass } from '../core/make-class'
import { FieldView } from './field-view'
import { trim } from '../util/trim'

export const TextFieldView = makeClass('TextFieldView', FieldView, (def) => {
  def.initializer(function() {
    this.super();
    this._autoTrim = true;
    this._placeholder = '';
  });
  
  def.property('autoTrim');
  def.property('placeholder');
  
  def.method('inputHTML', () => '<input type="text" class="text" />');
  
  def.method('convertValue', function(value) {
    if (value != null) { return String(value); } else { return null; }
  });
  
  def.method('getInputValue', function() {
    let value = this._inputElement.val();
    if (this._autoTrim && value) { value = trim(value); }
    return value;
  });
  
  def.method('setInputValue', function(value) {
    if (value && value.length) {
      this._inputElement.val(value);
      return this._inputElement.removeClass('placeholder');
    } else {
      this._inputElement.val(this._placeholder);
      return this._inputElement.addClass('placeholder');
    }
  });
  
  def.method('render', function() {
    this.super();
    this._inputElement.bind('keydown', this.method('keyDown'));
    this._inputElement.focus(this.method('inputFocus'));
    return this._inputElement.blur(this.method('inputBlur'));
  });
  
  def.method('keyDown', function(e) {
    if (e && e.which && (e.which === 13)) { return this.trigger('submit'); }
  });
  
  def.method('inputFocus', function() {
    if (this._inputElement.val() === this._placeholder) {
      this._inputElement.val('');
      return this._inputElement.removeClass('placeholder');
    }
  });

  def.method('inputBlur', function() {
    if (this._inputElement.val() === '') {
      this._inputElement.val(this._placeholder);
      return this._inputElement.addClass('placeholder');
    }
  });
  
  def.method('_placeholderChanged', function(oldPlaceholder, newPlaceholder) {
    if (this._loaded && (this._inputElement.val() === oldPlaceholder)) {
      this._inputElement.val(newPlaceholder);
      return this._inputElement.addClass('placeholder');
    }
  });
});
