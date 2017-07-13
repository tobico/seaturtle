import { FormField } from './FormField'
import { makeClass } from '../util/make-class'
import { trim } from '../util/trim'

// Form field for a date value. Requires "date.js"
export const FormDateField = makeClass(FormField, (def) => {
  def.initializer(function() {
    this.super();
    return this.allowNull = true;
  });
    
  def.property('allowNull');
  
  def.method('setValue', function(value) {
    this.super(value);
    if (this.loaded) { return this.inputTag.val(value); }
  });
  
  def.method('render', function(element) {
    this.super(element);
    this.inputTag = this.helper.tag('input');
    this.inputTag.addClass('text');
    this.inputTag.bind('keyup change', this.methodFn('inputChanged'));
    this.preview = this.helper.tag('div');
    this.updatePreview();
        
    if (this.value != null) { this.inputTag.val(this.value); }
    
    return element.append(this.inputTag, this.preview);
  });
  
  def.method('updatePreview', function() {
    if (this.value) {
      this.preview.show();
      if (this.value === 'Invalid Date') {
        return this.preview.html(`Invalid Date &mdash; Try format &lsquo;${(new Date()).toString('d MMM yyyy')}&rsquo;`);
      } else {
        return this.preview.text(this.value.toString('d MMMM yyyy'));
      }
    } else {
      return this.preview.hide();
    }
  });
  
  def.method('inputChanged', function() {
    const s = trim(this.inputTag.val());
    this.value = s === '' ? null : Date.parse(s) || 'Invalid Date';
    this.updatePreview();
    return this.trigger('valueChanged', this.value);
  });
  
  def.method('isValid', function() {
    if (!this.allowNull && (this.value === null)) { false; }
    return true;
  });
});
