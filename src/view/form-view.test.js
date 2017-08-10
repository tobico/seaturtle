import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { FormView } from './form-view'
import { BaseModel } from '../model/base-model'
import { ModelRegistry } from '../model/model-registry'
import { TextFieldView } from './text-field-view'
import { EnumFieldView } from './enum-field-view'

describe("FormView", function() {
  let registry, Author, Book, author, view
  
  beforeEach(() => {
    registry = ModelRegistry.create()
    Author = makeClass('Author', BaseModel, (def) => {
      def.register(registry)
      def.string('fullName')
      def.method('toFieldText', function() { return this.fullName() })
    })
    author = Author.createWithData({ fullName: 'Charles Dickens' })
    Book = makeClass('Book', BaseModel, (def) => {
      def.register(registry)
      def.string('title')
      // def.enum('format', 'paper', { hard: 'Hardcover', paper: 'Paperback', 'ebook': 'Electronic' })
      def.belongsTo('author', { model: 'Author' })
      def.bool('banned')
    })
    view = FormView.create({ model: Book }, function() {
      this.text('title')
      this.model('author')
      this.bool('banned')
      // this.enum('format')
    })
  })
  
  describe("#initWithModelAttributes", () =>
    it("should set fields", function() {
      expect(view._model).toBe(Book)
      const fieldIds = view._fields.toArray().map(field => field.id())
      expect(fieldIds).toEqual(['title', 'author', 'banned'])
    })
  )
  
  describe("#render", function() {
    it("should render a table", function() {
      view.render()
      expect(jQuery('table', view.element()).length).toEqual(1)
    })
    
    it("should render field labels", function() {
      view.render()
      const labels = 
        jQuery('label', view.element()).toArray().map(el =>
          jQuery(el).attr('for')
        )
      expect(labels).toEqual(['title', 'author', 'banned'])
    })
    
    it("should create TextFieldView for attribute", function() {
      view.render()
      expect(view.fieldById('title')).toBeInstanceOf(TextFieldView)
    })
    
    xit("should create EnumFieldView", function() {
      view.render()
      expect(view.fieldById('format')).toBeInstanceOf(EnumFieldView)
    })
  })
  
  describe("#data", function() {
    it("should include value for text field", function() {
      view.load()
      view.fieldById('title').value('Bacon Adventures')
      const data = view.data()
      expect(data['title']).toEqual('Bacon Adventures')
    })
    
    it("should include value for model field", function() {
      view.load()
      view.fieldById('author').value(author)
      const data = view.data()
      expect(data['author']).toBe(author)
    })

    it("includes correct value for boolean field when false", () => {
      view.load()
      view.fieldById('banned').value(false)
      const data = view.data()
      expect(data['banned']).toBe(false)
    })
  })
})
