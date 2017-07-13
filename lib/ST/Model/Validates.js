/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
ST.module('Model', function() {
  return this.module('Validates', function() {
    this.included(function() {
      return this.property('errors');
    });

    // Adds validations for a property
    this.classMethod('validates', function(property, validations) {
      if (!this._validations) { this._validations = {}; }
      if (this._validations[property]) {
        return $.extend(this._validations[property], validations);
      } else {
        return this._validations[property] = validations;
      }
    });

    // Validates a given data set
    this.classMethod('validate', function(data) {
      const errors = {};
      let valid = true;
      for (let key in data) {
        var propertyErrors;
        const value = data[key];
        if (propertyErrors = this.validateProperty(key, value)) {
          valid = false;
          errors[key] = propertyErrors;
        }
      }
      if (!valid) { return errors; }
    });

    // Validates a value for a single property, and returns a list of errors
    this.classMethod('validateProperty', function(property, value)  {
      let validations;
      if (validations = this._validations && this._validations[property]) {
        const errors = [];
        for (let name in validations) {
          const options = validations[name];
          ST.Model.Validates._validators[name](value, errors, options);
        }
        if (errors.length) { return errors; }
      }
    });

    // Checks if current attributes of model are valid
    this.method('valid', function() {
      this._errors = this._class.validate(this._attributes);
      return !this._errors;
    });

    // Define validators

    this.validator = function(name, definition) {
      if (!this._validators) { this._validators = {}; }
      return this._validators[name] = definition;
    };

    this.validator('presence', function(value, errors) {
      if (!ST.presence(value)) { return errors.push('is required'); }
    });

    this.validator('length', function(value, errors, options) {
      if (options instanceof Array) {
        options = {
          min: options[0],
          max: options[1]
        };
      }

      if (ST.presence(value)) {
        if ((options.min != null) && (value.length < options.min)) {
          errors.push(`must be at least ${options.min} characters`);
        }
        if ((options.max != null) && (value.length > options.max)) {
          return errors.push(`must be at most ${options.max} characters`);
        }
      }
    });

    return this.validator('within', function(value, errors, options) {
      if (ST.presence(value)) {
        if (options.indexOf(value) === false) {
          return errors.push(`must be one of ${options.join(', ')}`);
        }
      }
    });
  });
});