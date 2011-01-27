ST.class 'FormTextField', 'FormField', ->
  @constructor ->
    @_super()
    
    @autoTrim = true
    @minLength = null
    @maxLength = null
    @value = ''
  
  @property 'autoTrim'
  @property 'minLength'
  @property 'maxLength'
  
  @method 'setValue', (value) ->
    this._super(value);
    if (this.loaded) {
        this.inputTag.val(value);
    }
  
  @method 'render', (element) ->
    this._super(element);
    this.inputTag = ST.inputTag();
    if (this.value != null) {
        this.inputTag
            .val(this.value)
            .addClass('text')
            .keypress(this.methodFn('inputChanged'))
            .change(this.methodFn('inputChanged'));
    }
    
    element.append(this.inputTag);
  
  @method 'inputChanged', (e) ->
    if (e && e.which && e.which == 13) {
        this.trigger('submit');
    } else {
        this.value = this.inputTag.val();
        if (this.autoTrim) {
            this.value = $.trim(this.value);
        }
        this.trigger('valueChanged', this.value);
    }
  
  @method 'isValid', ->
    var l = this.value && this.value.length;
    if (this.minLength != null && l < this.minLength) return false;
    if (this.maxLength != null && l > this.maxLength) return false;
    return true;