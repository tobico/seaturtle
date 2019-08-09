import { makeClass } from '../core/make-class'
import { FieldView } from './field-view'

export const MemoFieldView = makeClass('MemoFieldView', FieldView, (def) => {
  def.initializer(function() {
    this.super()
    this._placeholder = ''
  })

  def.method('inputHTML', () => '<textarea />')

  def.method('convertValue', function(value) {
    if (value != null) { return String(value) } else { return null }
  })

  def.method('getInputValue', function() {
    return this._inputElement.val()
  })

  def.method('setInputValue', function(value) {
    this._inputElement.val(value)
  })
})
