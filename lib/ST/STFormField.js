STView.subClass('STFormField', {
    init: function()
    {
        this._super();
        this.value = null;
    },
    
    value:  ST.$property,
    label:  ST.$property,
    
    isValid: function()
    {
        return true;
    },
    
    _valueChanged: function()
    {
        this.trigger('changed');
    },
    
    validate: function()
    {
        var valid = this.isValid();
        var el = $('input, select', this.getElement());
        if (valid) {
            el.removeClass('invalid');
        } else {
            el.addClass('invalid');
        }
    },
    
end
:0});