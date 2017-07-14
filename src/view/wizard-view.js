import jQuery from 'jquery'

import { BaseView } from './base-view'
import { makeClass } from '../core/make-class'
import { DialogView } from './dialog-view'

export const WizardView = makeClass('WizardView', BaseView, (def) => {
  def.initializer(function() {
    this.super();

    this._steps = [];
    this._stepIndex = -1;
    this._data = {};
    
    // Build box for step details
    this._stepElement = jQuery('<div style="height: 200px"></div>');
    return this._element.append(this._stepElement);
  });
  
  def.accessor('height');
  def.property('data');
  def.property('steps');
  def.property('stepIndex');
  
  // Adds a step to the wizard process
  //
  // DSL:
  //   @paragraph    text
  //   @checkbox     field:, title:, default:
  //   @radioGroup   field:, options:, default:
  //   @textbox      field:, placeholder:, default:
  def.method('addStep', function(stepDefinition) {
    this._steps.push(stepDefinition);
    if (this.stepIndex() === -1) { return this.stepIndex(0); }
  });
  
  def.method('render', function() {
    // Load current step
    if (this._stepIndex !== -1) {
      this.renderStep(this._steps[this._stepIndex]);
      return this.updateButtons();
    }
  });
  
  def.method('dialogButtons', function(dialog, buttonbar) {
    this._dialog = dialog;
    this._buttonBar = buttonbar;
    if (this._steps.length > 1) {
      this._backButton = buttonbar.button('&lt; Back', this.method('lastStep'));
    }
    this._nextButton = buttonbar.button('Next &gt;', {default: true}, this.method('nextStep'));
    this._cancelButton = buttonbar.button('Cancel', {cancel: true}, this.method('cancel'));
    dialog.cancelFunction(this.method('cancel'));
    buttonbar.load();
    return this.updateButtons();
  });
    
  def.method('renderStep', function(stepDefinition) {
    const self = this;
    const element = this._stepElement;
    const data = this._data;
    element.empty();
    const components = {
      paragraph(text) {
        return jQuery(`<p>${text}</p>`).appendTo(element);
      },
      radioGroup(options) {
        if (!data[options.field]) { data[options.field] = options.default; }
        const ul = self.helper().tag('ul').addClass('radio-group');
        for (let value in options.options) {
          var label = options.options[value];
          (function(value) {
            const input = jQuery(`<input type=\"radio\" name=\"${options.field}\" value=\"${value}\" />`);
            const li = self.helper().tag('li').addClass('radio-item').append(
              input, `<label> ${label}</label>`
            );
            li.click(function() {
              data[options.field] = value;
              jQuery('input', this).attr('checked', true);
              jQuery(this).siblings('.radio-item-selected').removeClass('radio-item-selected');
              return jQuery(this).addClass('radio-item-selected');
            });
            if (value === data[options.field]) {
              input.attr('checked', true);
              li.addClass('radio-item-selected');
            }
            return ul.append(li);
          })(value);
        }
        return ul.appendTo(element);
      },
      checkbox(options) {
        if (!data[options.field]) { data[options.field] = options.default; }
        const input = jQuery(`<input type=\"checkbox\" id=\"${options.field}\" />`);
        input.bind('click change', function() {
          data[options.field] = input[0].checked;
          return undefined;
        });
        if (data[options.field]) { input.attr('checked', true); }
        element.append(input, `<label for=\"${options.field}\"> ${options.title}</label>`);
        return input;
      },
      textbox(options) {
        if (!data[options.field]) { data[options.field] = options.default; }
        const input = jQuery(`<textarea id=\"${options.field}\" />`);
        input.css({
          display:  'block',
          width:    '450px',
          height:   '60px',
          margin:   '10px 0'
        });
        if (options.placeholder) { input.attr('placeholder', options.placeholder); }
        input.val(data[options.field]);
        input.bind('keypress change', function() {
          data[options.field] = input.val();
          return undefined;
        });
        return input.appendTo(element);
      }
    };
    return stepDefinition.call(components);
  });
  
  def.method('getHeight', function() {
    return this._stepElement.css('height');
  });
  
  def.method('setHeight', function(value) {
    return this._stepElement.css('height', value);
  });
  
  def.method('updateButtons', function() {
    if (this._buttonBar) {
      this._buttonBar.buttonDisabled(this._backButton, this.atFirstStep());
      return this._buttonBar.buttonTitle(this._nextButton, this.atLastStep() ? 'Finish' : 'Next &gt;');
    }
  });
    
  def.method('_stepIndexChanged', function(oldValue, newValue) {
    if (this._loaded) {
      this.renderStep(this._steps[newValue]);
      return this.updateButtons();
    }
  });
  
  def.method('atFirstStep', function() {
    return this._stepIndex === 0;
  });
  
  def.method('atLastStep', function() {
    return this._stepIndex === (this._steps.length - 1);
  });
  
  def.method('nextStep', function() {
    if (this.atLastStep()) {
      return this.finish();
    } else {
      if (this._stepIndex < (this._steps.length - 1)) { return this.stepIndex(this._stepIndex + 1); }
    }
  });
  
  def.method('lastStep', function() {
    if (this._stepIndex > 0) { return this.stepIndex(this._stepIndex - 1); }
  });
  
  def.method('finish', function() {
    if (this._dialog) { this._dialog.close(); }
    return this.trigger('finished', this._data);
  });
  
  def.method('cancel', function() {
    if (this._dialog) { this._dialog.close(); }
    return this.trigger('cancelled');
  });

  def.method('present', function(title) {
    return DialogView.createWithTitleView(title, this);
  });
});
