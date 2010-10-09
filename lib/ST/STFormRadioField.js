STFormField.subClass('STFormRadioField', {

    init: function(options, otherOption)
    {
        this._super();
        this.setOptions(options);
        this.otherOption = otherOption || false;
    },
    
    otherOption:    ST.$property,
    
    addOption: function(value, label)
    {
        this.values.push(value);
        this.labels.push(label);
        if (this.loaded) this.refresh();
    },
    
    setOptions: function(options)
    {
        this.values = ST.A();
        this.labels = ST.A();
        if (options && options.length) {
            for (var i = 0; options[i] && options[i].length == 2; i++) {
                this.values.push(options[i][0]);
                this.labels.push(options[i][1]);
            }
        }
        if (this.loaded) this.refresh();
    },
    
    render: function(element)
    {
        this._super(element).refresh();
    },
    
    refresh: function()
    {
        var self = this;
        
        this.element.empty();
        var ul = ST.ulTag().appendTo(this.element);
        var name = 'stformradiofield_' + self._uid;
        var foundValue = false;
        this.values.each(function(value, i) {
            var id = name + '_' + i;
            
            var action = function() {
                self.optionClicked(value);
            };
            
            var input = ST.inputTag().addClass('radio').attr({
                type:   'radio',
                name:   name,
                id:     id
            }).click(action);
            if (self.value == value) {
                foundValue = true;
                input.attr('checked', true);
            }
            
            var label = ST.labelTag(self.labels[i]).attr('for', id);
            ul.append(ST.liTag(input, label));
        });
        if (this.otherOption) {
            var id = name + '_other';
            this.otherInput = ST.inputTag().addClass('radio').attr({
                type:   'radio',
                name:   name,
                id: id
            }).click(self.methodFn('otherClicked'));
            var label = ST.labelTag('Other &mdash;').attr('for', id);
            this.otherTextInput = ST.inputTag().attr({
                name:       name + '_text',
                disabled:   true
            }).change(this.methodFn('otherChanged'));
            
            this.otherTextOverlay = ST.divTag()
                .click(function() {
                    self.otherInput.attr('checked', true).click();
                });
                
            if (!foundValue) {
                this.otherInput.attr('checked', true);
                this.otherTextInput.removeAttr('disabled').val(this.value);
                this.otherTextOverlay.hide();
            }
                
            ul.append(ST.liTag(
                this.otherInput, label, ST.divTag(
                    this.otherTextInput, this.otherTextOverlay
                )
            ).addClass('otherOption'));
        }
    },
    
    optionClicked: function(value)
    {
        if (this.otherTextInput) {
            this.otherTextInput.attr('disabled', true);
            this.otherTextOverlay.show();
        }
        this.value = value;
    },
    
    otherClicked: function()
    {
        this.otherTextInput.removeAttr('disabled').focus();
        this.otherTextOverlay.hide();
        this.value = this.otherTextInput.val();
    },
    
    otherChanged: function()
    {
        this.value = this.otherTextInput.val();
    },
    
    isValid: function()
    {
        return true;
    },

end
:0});