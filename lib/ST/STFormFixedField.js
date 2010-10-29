STFormField.subClass('STFormFixedField', {
    initWithValueText: function(fixedValue, text)
    {
        this.init();
        this.fixedValue = fixedValue;
        this.setValue(fixedValue);
        this.text = text;
    },
    
    setValue: function(value)
    {
        //Only allow value to be set to predefined fixed value
        this._super(this.fixedValue);
    },
    
    render: function(element)
    {
        this._super(element);
        element.text(this.text);
    },
end
:0});