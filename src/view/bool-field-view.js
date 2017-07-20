import { makeClass } from '../core/make-class'
import { FieldView } from './field-view'

export const BoolFieldView = makeClass('BoolFieldView', FieldView, (def) => {
  def.method('inputHTML', () => '<input type="checkbox" />');
  
  def.method('convertValue', value => !!value);
  
  def.method('getInputValue', function() {
    return this._inputElement.is(':checked');
  });
  
  def.method('setInputValue', function(value) {
    if (value) {
      return this._inputElement.attr('checked', 'checked');
    } else {
      return this._inputElement.removeAttr('checked');
    }
  });
});
