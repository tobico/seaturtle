/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/View

ST.class('BoolFieldView', 'FieldView', function() {
  this.method('inputHTML', () => '<input type="checkbox" />');
  
  this.method('convertValue', value => !!value);
  
  this.method('getInputValue', function() {
    return this._inputElement.is(':checked');
  });
  
  return this.method('setInputValue', function(value) {
    if (value) {
      return this._inputElement.attr('checked', 'checked');
    } else {
      return this._inputElement.removeAttr('checked');
    }
  });
});