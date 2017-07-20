import { Index } from './index'
import { BaseModel } from './base-model'
import { List } from '../core/list'

describe("Index", function() {
  let index
  beforeEach(() => {
    index = Index.createWithModelAttribute(BaseModel, 'test')
  })
    
  describe("#createWithModelAttribute", function() {
    it("should set model", function() {
      expect(index._model).toBe(BaseModel)
    })
    
    it("should set attribute", function() {
      expect(index._attribute).toEqual('test')
    })
    
    it("should create empty values hash", function() {
      expect(index._values).toBeInstanceOf(Object)
    })
    
    it("should set default cardinality", function() {
      expect(index.cardinality()).toEqual(0)
    })
  })
  
  describe("#get", function() {
    it("should create a new list", function() {
      expect(index.get('banana')).toBeInstanceOf(List)
    })
    
    it("should an existing list", function() {
      const list = index.get('banana')
      expect(index.get('banana')).toBe(list)
    })
    
    it("should update cardinality", function() {
      index.get('banana')
      expect(index.cardinality()).toEqual(1)
    })
  })
  
  describe("#add", () =>
    it("should add item to list", function() {
      const object = {}
      index.add('banana', object)
      expect(index.get('banana').indexOf(object)).toEqual(0)
    })
  )
  
  describe("#remove", function() {
    it("should remove item from list", function() {
      const object = {}
      index.add('banana', object)
      index.add('banana', 'Test')
      index.remove('banana', object)
      expect(index.get('banana').indexOf(object)).toEqual(-1)
    })
    
    it("should remove list with last item", function() {
      const object = {}
      index.add('banana', object)
      index.remove('banana', object)
      expect(index._values['banana']).toBe(undefined)
    })
    
    it("should not remove list if bound", function() {
      const object = {}
      index.add('banana', object)
      index.get('banana').bind('itemAdded', object, 'itemAdded')
      index.remove('banana', object)
      expect(index._values['banana']).toBeInstanceOf(List)
    })
    
    it("should update cardinality when removing list", function() {
      const object = {}
      index.add('banana', object)
      index.remove('banana', object)
      expect(index.cardinality()).toEqual(0)
    })
  })
})
