/**
 * Form field for a date value. Requires "date.js"
 */
STFormField.subClass('STFormDateField', {
    init: function()
    {
        this._super();
        
        this.allowNull = true;
    },
    
    allowNull:  ST.$property,
    
    setValue: function(value)
    {
        this._super(value);
        if (this.loaded) {
            this.inputTag.val(value);
        }
    },
    
    render: function(element)
    {
        this._super(element);
        this.inputTag = ST.inputTag()
            .addClass('text')
            .keyup(this.methodFn('inputChanged'))
            .change(this.methodFn('inputChanged'));
        this.preview = ST.divTag();
        this.updatePreview();
            
        if (this.value != null) this.inputTag.val(this.value);
        
        element.append(this.inputTag, this.preview);
    },
    
    updatePreview: function()
    {
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
    },
    
    inputChanged: function()
    {
        var s = $.trim(this.inputTag.val());
        this.value = (s == '') ? null : (Date.parse(s) || 'Invalid Date');
        this.updatePreview();
        this.trigger('valueChanged', this.value);
    },
    
    isValid: function()
    {
        if (!this.allowNull && this.value == null) return false;
        return true;
    },
end
:0});