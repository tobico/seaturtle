# Form field for a date value. Requires "date.js"
ST.class 'FormDateField', 'FormField', ->
  @constructor ->
    this._super();
    
    this.allowNull = true;
    
  @property 'allowNull'
  
  @method 'setValue', (value) ->
    this._super(value);
    if (this.loaded) {
        this.inputTag.val(value);
    }
  
  @method 'render', (element) ->
    this._super(element);
    this.inputTag = ST.inputTag()
        .addClass('text')
        .keyup(this.methodFn('inputChanged'))
        .change(this.methodFn('inputChanged'));
    this.preview = ST.divTag();
    this.updatePreview();
        
    if (this.value != null) this.inputTag.val(this.value);
    
    element.append(this.inputTag, this.preview);
  
  @method 'updatePreview', ->
    if (this.value) {
        this.preview.show();
        if (this.value == 'Invalid Date') {
            this.preview.html('Invalid Date &mdash; Try format &lsquo;' + (new Date()).toString('d MMM yyyy') + '&rsquo;');
        } else {
            this.preview.text(this.value.toString('d MMMM yyyy'));
        }
    } else {
        this.preview.hide();
    }
  
  @method 'inputChanged', ->
    var s = $.trim(this.inputTag.val());
    this.value = (s == '') ? null : (Date.parse(s) || 'Invalid Date');
    this.updatePreview();
    this.trigger('valueChanged', this.value);
  
  @method 'isValid', ->
    false if !@allowNull && @value == null
    true