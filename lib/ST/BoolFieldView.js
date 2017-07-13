import { FieldView } from '../FieldView'
import { makeClass } from '../../util/make-class'

export const BoolFieldView = makeClass(FieldView, (def) => {
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
