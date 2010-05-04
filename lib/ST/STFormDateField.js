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
        this.inputTag = ST.inputTag();
        if (this.value != null) {
            this.inputTag
                .val(this.value)
                .keypress(this.methodFn('inputChanged'))
                .change(this.methodFn('inputChanged'));
        }
        
        element.append(this.inputTag);
    },
    
    inputChanged: function()
    {
        var s = $.trim(this.inputTag.val());
        this.value = (this.value == '') ? null : (new Date(s));
        this.trigger('valueChanged', this.value);
    },
    
    isValid: function()
    {
        if (!this.allowNull && this.value == null) return false;
        return true;
    },
end
:0});