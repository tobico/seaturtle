/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/View
//= require ST/TextFieldView
//= require ST/ModelFieldView
//= require ST/EnumFieldView
//= require ST/BoolFieldView
//= require ST/DateTimeFieldView

ST.class('FormView', 'View', function() {
  this.retainedProperty('errors');

  this.initializer(function(options, definition) {
    const self = this;

    this.super();

    this._command   = options.command || 'Save Form';
    this._defaults  = options.defaults || null;
    this._fields    = ST.List.create();

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
        return field.release();
      },
      text(attribute, options) {
        if (options == null) { options = {}; }
        return this._add(ST.TextFieldView.create(), attribute, options);
      },
      enum(attribute, options) {
        if (options == null) { options = {}; }
        $.extend(options, self.detailsFor(attribute));
        return this._add(ST.EnumFieldView.createWithValuesNull(options.values, options.null), attribute, options);
      },
      bool(attribute, options) {
        if (options == null) { options = {}; }
        return this._add(ST.BoolFieldView.create(), attribute, options);
      },
      datetime(attribute, options) {
        if (options == null) { options = {}; }
        return this._add(ST.DateTimeFieldView.create(), attribute, options);
      },
      model(attribute, options) {
        if (options == null) { options = {}; }
        const details = self.detailsFor(attribute);
        const field = ST.ModelFieldView.createWithModel(self._model._namespace.class(details.model));
        if (details.searchesRemotelyAt) { field.searchRemotelyAt(details.searchesRemotelyAt); }
        return this._add(field, attribute, options);
      }
    };
    definition.call(dsl);
    return this.loadFieldValues();
  });

  this.property('defaults');
  this.property('model');
  this.property('item');
  this.property('command');

  this.destructor(function() {
    this._fields.empty();
    return this.super();
  });

  this.method('loadFieldValues', function() {
    const self = this;
    return this._fields.each(function(field) {
      const attribute = field.id();
      return field.value((() => {
        
        let details;
        if (self._item) {
          if ($.isFunction(self._item[attribute])) {
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

  this.method('clearValidationErrors', function() {
    if (this._errors) { return this._errors.element().empty(); }
  });

  this.method('detailsFor', function(attribute) {
    return this._model._attributes[attribute];
});

  this.method('fieldById', function(id) {
    return this._fields.find(field => field.id() === id);
  });

  this.method('generateTableHTML', function() {
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

  this.method('render', function() {
    const self = this;
    this._element.html(this.generateTableHTML());

    this._fields.each(function(field) {
      const cell = $(`#cell_for_${field.id()}`, self._element);
      field.load();
      return cell.append(field.element());
    });

    const errors = ST.View.create();
    this.errors(errors);
    this._children.add(this._errors);
    return errors.release();
  });

  this.method('data', function() {
    const data = {};

    // Copy default values into data
    for (let attribute in this._defaults) {
      if (this._defaults.hasOwnProperty(attribute)) {
        data[attribute] = this._defaults[attribute];
      }
    }

    // Read field values into data
    this._fields.each(field => data[field.id()] = field.value() || null);

    return data;
  });

  this.method('save', function() {
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

  this.method('showValidationErrors', function(errors) {
    this.clearValidationErrors();
    for (let fieldId in errors) {
      const fieldErrors = errors[fieldId];
      const field = this.fieldById(fieldId);
      const hint = $(`<div class="error-hint">${fieldErrors[0]}</div>`);
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

  this.method('submit', function() {
    if (ST.command(this._command, this.method('save'))) {
      if (this._dialog) { return this._dialog.close(); }
    }
  });

  this.method('cancel', function() {
    this.trigger('cancelled');
    if (this._dialog) { return this._dialog.close(); }
  });

  return this.method('dialogButtons', function(dialog, buttonbar) {
    this._dialog = dialog;
    const self = this;
    buttonbar.button('&nbsp;&nbsp;&nbsp;OK&nbsp;&nbsp;&nbsp;&nbsp;', this.method('submit'));
    buttonbar.button('Cancel', this.method('cancel'));
    if (ST.mac()) { buttonbar.reverse(); }
    return dialog.cancelFunction(this.method('cancel'));
  });
});
