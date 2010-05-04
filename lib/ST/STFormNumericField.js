STFormTextField.subClass('STFormNumericField', {
    init: function()
    {
        this._super();
        
        this.minValue = null;
        this.maxValue = null;
        this.allowNull = false;
        this.allowFloat = true;
    },
    
    minValue:   ST.$property,
    maxValue:   ST.$property,
    allowNull:  ST.$property,
    allowFloat: ST.$property,
    
    inputChanged: function()
    {
        var s = $.trim(this.inputTag.val());
        this.value = s == '' ? null : Number(s);
        this.trigger('valueChanged', this.value);
    },
    
    isValid: function()
    {
        if (isNaN(this.value)) return false;
        if (this.value == null && this.allowNull) return true;
        if (!this.allowFloat && Math.floor(this.value) != this.value) return false;
        return true;
    },
end
:0});