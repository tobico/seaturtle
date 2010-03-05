/**
 * Class to maintain and display a list of buttons.
 *
 * @constructor
 */
STView.subClass('STButtonBar', {
    init: function()
    {
        this.initWithButtons();
    },
    
    initWithButtons: function()
    {
        this.initWithElement(ST.customTag('buttonbar'));
        var self = this;
        
        this.buttons = [];
        
        if (arguments.length) {
            $.each(arguments, function() {
                self.addButton(this);
            });
        }
    },

    /**
     * Adds a new button to this button bar.
     *
     * Passes arguments to {@link #button} function to create button.
     */
    addButton: function()
    {
        this.buttons.push(button.apply(false, arguments));
        if (this.loaded) this.reload();
    },
    
    setButtons: function(buttons)
    {
        this.buttons = buttons;
        if (this.loaded) this.reload();
    },
    
    /**
     * Renders DOM nodes for button bar into internal DOMElement e
     */
    render: function()
    {
        this._super();
        
        for(i in this.buttons) {
            if (i > 0) this.element.append(' ');
            this.element.append(this.buttons[i]);
        };
    },
   
end 
:0});