STFormField.subClass('STFormOptionsField', {

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
        this._super(element).refresh();
    },
    
    refresh: function()
    {
        var self = this;
        
        this.element.empty();
        $.each(this.options, function(i) {
            var option = this;
            var button = ST.buttonTag(self.labels[i] || self.options[i]).click(function() {
                self.value = self.options[i];
                self.trigger('valueChanged', self.value);
                $('.option_sel', self.element).removeClass('option_sel');
                button.addClass('option_sel');
            }).addClass('option');
            if (self.options[i] == self.value) {
                button.addClass('option_sel');
            }
            self.element.append(button);
        });
    },
    
    isValid: function()
    {
        if (this.value == null && !this.allowNull) return false;
        return true;
    },

end
:0});