/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Form field for a date value. Requires "date.js"
ST.class('FormDateField', 'FormField', function() {
  this.initializer(function() {
    this.super();
    return this.allowNull = true;
  });
    
  this.property('allowNull');
  
  this.method('setValue', function(value) {
    this.super(value);
    if (this.loaded) { return this.inputTag.val(value); }
  });
  
  this.method('render', function(element) {
    this.super(element);
    this.inputTag = this.helper.tag('input');
    this.inputTag.addClass('text');
    this.inputTag.bind('keyup change', this.methodFn('inputChanged'));
    this.preview = this.helper.tag('div');
    this.updatePreview();
        
    if (this.value != null) { this.inputTag.val(this.value); }
    
    return element.append(this.inputTag, this.preview);
  });
  
  this.method('updatePreview', function() {
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
  
  this.method('inputChanged', function() {
    const s = $.trim(this.inputTag.val());
    this.value = s === '' ? null : Date.parse(s) || 'Invalid Date';
    this.updatePreview();
    return this.trigger('valueChanged', this.value);
  });
  
  return this.method('isValid', function() {
    if (!this.allowNull && (this.value === null)) { false; }
    return true;
  });
});