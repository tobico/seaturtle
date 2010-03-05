STField.subClass('STOptionsField', {

    init: function()
    {
        this._super();
        this.options = [];
        this.labels = [];
        this.allowNull = false;
    },
    
    options:   ST.$property,
    labels:    ST.$property,
    allowNull: ST.$property,
    
    render: function(element)
    {
        this._super(element);
        
        var self = this;
        
        element.empty();
        $.each(this.options, function(i) {
            var option = this;
            var button = ST.buttonTag(self.labels[i]).click(function() {
                self.value = self.options[i];
                self.trigger('valueChanged', self.value);
                $('.option_sel', element).removeClass('option_sel');
                button.addClass('option_sel');
            }).addClass('option');
            if (self.options[i] == self.value) {
                button.addClass('option_sel');
            }
            element.append(button);
        });
    },
    
    isValid: function()
    {
        if (this.value == null && !this.allowNull) return false;
        return true;
    },

end
:0});