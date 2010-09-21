STView.subClass('STForm', {
    initWithRecord: function(record)
    {
        this.init();
        this.record = record;
        if (record.retain) record.retain();
        this.fields = STIndexedList.create();
        this.element.addClass('STForm')
    },
    
    record:     ST.$property(null, 'readonly'),
    
    destroy: function()
    {
        var self = this;
        this.releaseMembers('fields', 'record');
        this._super();
    },
    
    addField: function(field)
    {
        this.fields.add(field);
        if (field.member) {
            field.setValue(
                (this.record.get || STObject.prototype.get)
                    .call(this.record, field.member)
            );
        }
    },
    
    addAndReleaseField: function(field)
    {
        this.addField(field);
        field.release();
    },
    
    render: function(element)
    {
        this._super(element);
        var self = this;
        
        var table = ST.tableTag().css('width', '100%');
        this.fields.each(function(field) {
            table.append(ST.trTag(
                ST.tdTag(field.label || ''),
                ST.tdTag(
                    field.load().getElement()
                )
            ));
        });
        element.append(table);
        
        element.append(ST.customTag('buttonbar').append(
            ST.aTag('&nbsp;&nbsp;OK&nbsp;&nbsp;')
              .click(this.methodFn('save'))
              .addClass('button'),
            ' ',
            ST.aTag('Cancel')
              .click(Dialog.hide)
              .addClass('button')
        ));
    },
    
    save: function()
    {
        var self = this;
        
        // Check if all fields are valid
        if (this.fields.all('isValid')) {
            // Save values in fields to record
            this.fields.each(function(field) {
                if (field.member) {
                    (self.record.set || STObject.prototype.set).call(
                        self.record, field.member, field.getValue()
                    );
                }
            });
            
            // Trigger saved event
            this.trigger('saved');
            Dialog.hide();
        } else {
            // Hilight invalid fields
            this.fields.each('validate');
            
            // Focus on first invalid field
            var invalid = $('input.invalid, select.invalid', this.getElement());
            if (invalid.length) invalid[0].focus();
        }
    },
    
    showDialog: function(events)
    {
        if (!events) {
            events = {};
        }
        if (!events.onCancel) {
            events.onCancel = Dialog.hide;
        }
        this._super(events);
    },
    
end
:0});