/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/FieldView

ST.class('TextFieldView', 'FieldView', function() {
  this.initializer(function() {
    this.super();
    this._autoTrim = true;
    return this._placeholder = '';
  });
  
  this.property('autoTrim');
  this.property('placeholder');
  
  this.method('inputHTML', () => '<input type="text" class="text" />');
  
  this.method('convertValue', function(value) {
    if (value != null) { return String(value); } else { return null; }
  });
  
  this.method('getInputValue', function() {
    let value = this._inputElement.val();
    if (this._autoTrim && value) { value = $.trim(value); }
    return value;
  });
  
  this.method('setInputValue', function(value) {
    if (value && value.length) {
      this._inputElement.val(value);
      return this._inputElement.removeClass('placeholder');
    } else {
      this._inputElement.val(this._placeholder);
      return this._inputElement.addClass('placeholder');
    }
  });
  
  this.method('render', function() {
    this.super();
    this._inputElement.bind('keydown', this.method('keyDown'));
    this._inputElement.focus(this.method('inputFocus'));
    return this._inputElement.blur(this.method('inputBlur'));
  });
  
  this.method('keyDown', function(e) {
    if (e && e.which && (e.which === 13)) { return this.trigger('submit'); }
  });
  
  this.method('inputFocus', function() {
    if (this._inputElement.val() === this._placeholder) {
      this._inputElement.val('');
      return this._inputElement.removeClass('placeholder');
    }
  });

  this.method('inputBlur', function() {
    if (this._inputElement.val() === '') {
      this._inputElement.val(this._placeholder);
      return this._inputElement.addClass('placeholder');
    }
  });
  
  return this.method('_placeholderChanged', function(oldPlaceholder, newPlaceholder) {
    if (this._loaded && (this._inputElement.val() === oldPlaceholder)) {
      this._inputElement.val(newPlaceholder);
      return this._inputElement.addClass('placeholder');
    }
  });
});