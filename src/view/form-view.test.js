import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { FormView } from './form-view'
import { BaseModel } from '../model/base-model'
import { ModelRegistry } from '../model/model-registry'
import { TextFieldView } from './text-field-view'
import { EnumFieldView } from './enum-field-view'

xdescribe("FormView", function() {
  let registry, Author, Book, author, view
  
  beforeEach(() => {
    registry = ModelRegistry.create()
    Author = makeClass('Author', BaseModel, (def) => {
      def.register(registry)
      def.string('fullName')
      def.method('toFieldText', function() { return this.name() })
    })
    author = Author.createWithData({name: 'Charles Dickens'})
    Book = makeClass('Book', BaseModel, (def) => {
      def.register(registry)
      def.string('title')
      def.enum('format', 'paper', { hard: 'Hardcover', paper: 'Paperback', 'ebook': 'Electronic' })
      def.belongsTo('author', { model: 'Author' })
    })
    view = FormView.create({ model: Book }, function() {
      this.text('title')
      this.model('author')
      this.enum('format')
    })
  })
  
  describe("#initWithModelAttributes", () =>
    it("should set values", function() {
      expect(view._model).toBe(Book)
      expect(view._attributes).toEqual(['title', 'author', 'format'])
    })
  )
  
  describe("#render", function() {
    it("should render a table", function() {
      view.render()
      expect(jQuery('table', view.element()).length).toEqual(1)
    })
    
    it("should render field labels", function() {
      view.render()
      const label = jQuery('label', view.element())
      expect(label.length).toEqual(3)
      expect(label.eq(0).attr('for')).toEqual('title')
      expect(label.eq(1).attr('for')).toEqual('author')
      expect(label.eq(2).attr('for')).toEqual('format')
    })
    
    it("should create TextFieldView for attribute", function() {
      view.render()
      expect(view._fields['title']).toBeInstanceOf(TextFieldView)
    })
    
    it("should create EnumFieldView", function() {
      view.render()
      expect(view._fields['format']).toBeInstanceOf(EnumFieldView)
    })
  })
  
  describe("#data", function() {
    it("should include value for text field", function() {
      view.load()
      view._fields['title'].value('Bacon Adventures')
      const data = view.data()
      expect(data['title']).toEqual('Bacon Adventures')
    })
    
    it("should include value for model field", function() {
      view.load()
      view._fields['author'].value(author)
      const data = view.data()
      expect(data['author']).toBe(author)
    })
  })
})
