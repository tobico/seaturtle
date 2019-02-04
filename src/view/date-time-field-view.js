import jQuery from 'jquery'
import { format } from 'date-fns'

import { makeClass } from '../core/make-class'
import { FieldView } from './field-view'

export const DateTimeFieldView = makeClass('DateTimeFieldView', FieldView, (def) => {
  def.initializer(function() {
    this.super();
    return this._dateElement = (this._timeElement = null);
  });

  def.method('render', function() {
    this._dateElement = jQuery('<input type="date" class="text" style="width: 140px; margin-right: 15px" />');
    this._dateElement.val(this.dateValue(this._value));
    this._timeElement = jQuery('<input type="time" class="text" style="width: 100px" />');
    this._timeElement.val(this.timeValue(this._value));
    this.element().append(this._dateElement, this._timeElement);
    jQuery('input', this.element()).bind('click keyup change', this.method('inputChanged'));
  });

  def.method('convertValue', function(value) {
    if (value instanceof Date) {
      return value;
    } else if (value != null) {
      return Date.parse(value);
    } else { return null; }
  });

  def.method('getInputValue', function() {
    const date = this._dateElement.val() || '';
    const time = this._timeElement.val() || '';
    if (time && date) {
      return Date.parse(`${date}T${time}`);
    } else if (date) {
      return Date.parse(date);
    }
  });

  def.method('setInputValue', function(value) {
    this._dateElement.val(this.dateValue(value));
    return this._timeElement.val(this.timeValue(value));
  });

  def.method('dateValue', function(value) {
    const date = value && format(value, 'YYYY-MM-DD');
    if (date === '1970-01-1') {
      return '';
    } else {
      return date;
    }
  });

  def.method('timeValue', function(value) {
    const time = value && format(value, 'HH:mm');
    if (time === '00:00') {
      return '';
    } else {
      return time;
    }
  });
});
