STFormField.subClass('STFormModelField', {
    initWithModelSearcher: function(model, searcher)
    {
        this.init();
        
        this.required = false;
        this.autoField = STAutoField.create();
        this.autoField.setDelegate(this);
        this.addChild(this.autoField);
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
    
    setValue: function(value)
    {
        this._super(value);
        if (this.loaded) {
            this.autoField.setValue(value);
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
            this.value = result.uuid;
            this.autoField.inputElement.val(result.textLabel);
            this.trigger('valueChanged', this.value);
        } else if (result == null && !this.required) {
            this.value = null;
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