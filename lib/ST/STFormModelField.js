STFormField.subClass('STFormModelField', {
    initWithModelSearcher: function(model, searcher, labelField)
    {
        this.init();
        
        this.required = false;
        this.autoField = STAutoField.create();
        this.autoField.setDelegate(this);
        this.addChild(this.autoField);
        this.labelField = labelField || 'label';
        this.set({
            model:      model,
            searcher:   searcher,
            required:   false,
            value:      null
        });
    },
    
    model:      ST.$property,
    searcher:   ST.$property,
    required:   ST.$property,
    
    destroy: function()
    {
        this.releaseMembers('autoField');
        this._super();
    },
    
    load: function()
    {
        this._super();
        
        var record = STModel.Index[this.value];
        this.autoField.setValue(record && record.get(this.labelField));
    },
    
    setValue: function(value, noUpdate)
    {
        this._super(value);
        
        if (this.loaded && !noUpdate) {
            var record = STModel.Index[value];
            this.autoField.setValue(record && record.get(this.labelField));
        }
    },
    
    setLabel: function(value)
    {
        this.label = value;
        this.autoField.setLabel();
    },
    
    setModel: function(value)
    {
        this.model = value;
        this.autoField.setLabel(value._name);
    },
    
    setSearcher: function(value)
    {
        value.retain();
        this.autoField.searchers.empty();
        this.releaseMembers('searcher');
        this.searcher = value;
        this.autoField.addSearcher(this.searcher);
    },
    
    setRequired: function(value)
    {
        this.required = value;
        this.autoField.setAcceptsNull(!value);
    },
    
    autoFieldSelectedResult: function(autoField, result)
    {
        if (result.uuid) {
            this.setValue(result.uuid, true);
            this.autoField.inputElement.val(result.textLabel);
            this.trigger('valueChanged', this.value);
        } else if (result == null && !this.required) {
            this.setValue(null, true);
            this.autoField.inputElement.val('');
            this.trigger('valueChanged', this.value);
        }
    },
    
    isValid: function()
    {
        return !(this.required && !this.value);
    },
end
:0});