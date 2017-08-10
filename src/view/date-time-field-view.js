import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { FieldView } from './field-view'

export const DateTimeFieldView = makeClass('DateTimeFieldView', FieldView, (def) => {
  def.initializer(function() {
    this.super();
    return this._dateElement = (this._timeElement = null);
  });
  
  def.method('padNumber', function(number) {
    let s = `${number}`;
    if (s.length === 1) { s = `0${s}`; }
    return s;
  });
  
  def.method('isoDate', function(date) {
    const items = date.split('/');
    if (items.length === 3) {
      return [items[2], this.padNumber(items[1]), this.padNumber(items[0])].join('-');
    }
  });
  
  def.method('isoTime', function(time) {
    let result;
    if (result = time.match(/(\d\d?):(\d\d?)(am|pm)/i)) {
      let hour = Number(result[1]);
      if (hour === 12) { hour = 0; }
      if (result[3].toLowerCase() === 'pm') { hour += 12; }
      const minute = Number(result[2]);
      return `${this.padNumber(hour)}:${this.padNumber(minute)}`;
    }
  });
  
  def.method('render', function() {
    this._dateElement = jQuery('<input type="text" class="text" style="width: 100px; margin-right: 15px" />');
    this._dateElement.val(this.dateValue(this._value));
    this._timeElement = jQuery('<input type="text" class="text" style="width: 100px" />');
    this._timeElement.val(this.timeValue(this._value));
    this.element().append(this._dateElement, this._timeElement);
    jQuery('input', this.element()).bind('click keyup change', this.method('inputChanged'));
    this._dateElement.calendricalDate();
    return this._timeElement.calendricalTime();
  });
  
  def.method('convertValue', function(value) {
    if (value instanceof Date) {
      return value;
    } else if (value != null) {
      return Date.parse(value);
    } else { return null; }
  });
  
  def.method('getInputValue', function() {
    const date = this.isoDate(this._dateElement.val()) || '';
    const time = this.isoTime(this._timeElement.val()) || '';
    if (time) {
      return Date.parse(`${date} ${time}`);
    } else if (date) {
      return Date.parse(date);
    }
  });
  
  def.method('setInputValue', function(value) {
    this._dateElement.val(this.dateValue(value));
    return this._timeElement.val(this.timeValue(value));
  });
  
  def.method('dateValue', function(value) {
    const date = value && value.toString('d/M/yyyy');
    if (date === '1/1/1970') {
      return '';
    } else {
      return date;
    }
  });
  
  def.method('timeValue', function(value) {
    const time = value && value.toString('h:mmtt').toLowerCase();
    if (time === '0:00am') {
      return '';
    } else {
      return time;
    }
  });
});
