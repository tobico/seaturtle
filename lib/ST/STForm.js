STView.subClass('STForm', {
    initWithRecord: function(record)
    {
        this.init();
        this.record = record.retain();
        this.fields = STIndexedArray.create();
    },
    
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
            field.setValue(this.record.get(field.member));
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
        
        if (this.fields.all(ST.P('isValid'))) {
            this.fields.each(function(field) {
                if (field.member) {
                    self.record.set(field.member, field.getValue());
                }
            });
            this.trigger('saved');
            Dialog.hide();
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