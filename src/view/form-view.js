import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { List } from '../core/list'
import { BaseView } from './base-view'
import { TextFieldView } from './text-field-view'
import { EnumFieldView } from './enum-field-view'
import { BoolFieldView } from './bool-field-view'
import { DateTimeFieldView } from './date-time-field-view'
import { ModelFieldView } from './model-field-view'
import { Command } from '../util/command'
import { detectMac } from '../util/detect'

export const FormView = makeClass('FormView', BaseView, (def) => {
  def.retainedProperty('errors');

  def.initializer(function(options, definition) {
    const self = this;

    this.super();

    this._command   = options.command || 'Save Form';
    this._defaults  = options.defaults || null;
    this._fields    = List.create();
    this._saved = false

    if (options.scope) {
      this._scope = options.scope;
      this._model = options.scope.model();
    } else if (options.item) {
      this._item  = options.item;
      this._model = options.item._class;
    } else {
      this._model   = options.model;
    }

    const dsl = {
      _add(field, attribute, options) {
        if (options == null) { options = {}; }
        field.id(attribute);
        if (options.label) { field.label(options.label); }
        field.bind('submit', self);
        self._fields.add(field);
        field.release();
      },
      text(attribute, options={}) {
        this._add(TextFieldView.create(), attribute, options);
      },
      enum(attribute, options={}) {
        jQuery.extend(options, self.detailsFor(attribute));
        this._add(EnumFieldView.createWithValues(options.values, options), attribute, options);
      },
      bool(attribute, options={}) {
        this._add(BoolFieldView.create(), attribute, options);
      },
      datetime(attribute, options={}) {
        this._add(DateTimeFieldView.create(), attribute, options);
      },
      model(attribute, options={}) {
        const details = self.detailsFor(attribute);
        const field = ModelFieldView.createWithModel(self._model.registry().getModel(details.model))
        if (details.searchesRemotelyAt) { field.searchRemotelyAt(details.searchesRemotelyAt, details.remoteSearchOptions); }
        this._add(field, attribute, options);
      }
    };
    definition.call(dsl);
    this.loadFieldValues();
  });

  def.property('defaults');
  def.property('model');
  def.property('item');
  def.property('command');

  def.destructor(function() {
    this._fields.empty();
    return this.super();
  });

  def.method('loadFieldValues', function() {
    const self = this;
    return this._fields.each(function(field) {
      const attribute = field.id();
      return field.value((() => {

        let details;
        if (self._item) {
          if (jQuery.isFunction(self._item[attribute])) {
            return self._item[attribute]();
          } else {
            return self._item[attribute];
          }
        } else if (self._defaults && self._defaults[attribute]) {
          return self._defaults[attribute];
        } else if (details = self.detailsFor(attribute)) {
          return details.default;
        }

      })());
    });
  });

  def.method('clearValidationErrors', function() {
    if (this._errors) { return this._errors.element().empty(); }
  });

  def.method('detailsFor', function(attribute) {
    return this._model._attributes[attribute];
  });

  def.method('fieldById', function(id) {
    return this._fields.find(field => field.id() === id);
  });

  def.method('generateTableHTML', function() {
    const self = this;
    const html = ['<table class="formView">'];
    this._fields.each(function(field) {
      const attribute = field.id();
      return html.push('<tr><th class="label"><label for="', attribute, '">',
        field.label() || self._model.labelForAttribute(attribute),
        ':</label></th><td class="field" id="cell_for_', attribute,
        '"></td></tr>');
    });
    html.push('</table>');
    return html.join('');
  });

  def.method('render', function() {
    const self = this;
    this._element.html(this.generateTableHTML());

    this._fields.each(function(field) {
      const cell = jQuery(`#cell_for_${field.id()}`, self._element);
      field.load();
      return cell.append(field.element());
    });

    const errors = BaseView.create();
    this.errors(errors);
    this._children.add(this._errors);
    errors.release();
  });

  def.method('data', function() {
    const data = {};

    // Copy default values into data
    for (let attribute in this._defaults) {
      if (this._defaults.hasOwnProperty(attribute)) {
        data[attribute] = this._defaults[attribute];
      }
    }

    // Read field values into data
    this._fields.each(field => {
      const value = field.value()
      data[field.id()] = value === undefined ? null : value
    });

    return data;
  });

  def.method('save', function() {
    let errors;
    const data = this.data();
    if (this._model && (errors = this._model.validate(data))) {
      this.showValidationErrors(errors);
      return false;
    } else {
      const item = (() => {
        if (this._item) {
        if (this._item.set) {
          this._item.set(data);
        } else {
          for (let key in data) {
            const value = data[key];
            this._item[key] = value;
          }
        }
        return this._item;
      } else if (this._scope) {
        return this._scope.build(data);
      } else {
        return this._model.createWithData(data);
      }
      })();
      this.trigger('saved', item);
      return true;
    }
  });

  def.method('showValidationErrors', function(errors) {
    this.clearValidationErrors();
    for (let fieldId in errors) {
      const fieldErrors = errors[fieldId];
      const field = this.fieldById(fieldId);
      const hint = jQuery(`<div class="error-hint">${fieldErrors[0]}</div>`);
      hint.css('top', field.element().parent().position().top);
      this._errors.element().append(hint);
    }

    // Focus on first error
    return this._fields.each(function(field) {
      if (errors[field.id()]) {
        field.focus();
        return 'break';
      }
    });
  });

  def.method('submit', function() {
    if (this._saved) { return }

    if (Command.command(this._command, this.method('save'))) {
      this._saved = true
      if (this._dialog) {
        this._dialog.close();
      }
    }
  });

  def.method('cancel', function() {
    this.trigger('cancelled');
    if (this._dialog) { return this._dialog.close(); }
  });

  def.method('dialogButtons', function(dialog, buttonbar) {
    this._dialog = dialog;
    const self = this;
    buttonbar.button('&nbsp;&nbsp;&nbsp;OK&nbsp;&nbsp;&nbsp;&nbsp;', this.method('submit'));
    buttonbar.button('Cancel', this.method('cancel'));
    if (detectMac()) { buttonbar.reverse(); }
    return dialog.cancelFunction(this.method('cancel'));
  });
});
