ST.subClass 'FormRadioField', 'FormField', ->
  @constructor (options, otherOption) ->
    @_super()
    @setOptions options
    @otherOption = otherOption || false
  
  @property 'otherOption'
  
  @method 'addOption', (value, label) ->
    @values.push value
    @labels.push label
    @refresh() if @loaded
  
  @method 'setOptions', (options) ->
    @values = []
    @labels = []
    if options && options.length
      for pair in options
        values.push pair[0]
        labels.push pair[1]
    @refresh if @loaded
  
  @method 'render', (element) ->
    @_super element
    @refresh()
  
  @method 'refresh', ->
    self = this
    
    @element.empty()
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
  
  @method 'optionClicked', (value) ->
    if (this.otherTextInput) {
        this.otherTextInput.attr('disabled', true);
        this.otherTextOverlay.show();
    }
    this.value = value;
  
  @method 'otherClicked', ->
    this.otherTextInput.removeAttr('disabled').focus();
    this.otherTextOverlay.hide();
    this.value = this.otherTextInput.val();
  
  @method 'otherChanged', ->
    this.value = this.otherTextInput.val();
  
  @method 'isValid', -> true