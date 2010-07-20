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
        var self = this.initWithElement(ST.customTag('buttonbar'));
        
        this.buttons = new STArray();
        
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
        var myButton = button.apply(false, arguments);
        this.buttons.push(myButton);
        if (this.loaded) {
            this.element.append(myButton);
        }
        return myButton;
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
        var self = this;
        this._super();
        
        $.each(this.buttons, function() {
            self.element.append(this);
        });
    },
   
end 
:0});