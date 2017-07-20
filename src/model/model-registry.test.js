import { makeClass } from '../core/make-class'
import { BaseModel } from './base-model'
import { ModelRegistry } from './model-registry'

describe("ModelRegistry", () => {
  let registry, TestModel

  beforeEach(() => {
    registry = ModelRegistry.create()
    TestModel = makeClass('TestModel', BaseModel, (def) => {
      def.register(registry)
    })
  })

  describe('#getModel', () => {
    it('finds registered model by name', () => {
      expect(registry.getModel('TestModel')).toBe(TestModel)
    })

    it('returns undefined when not found', () => {
      expect(registry.getModel('Foo')).toBe(undefined)
    })
  })

  describe("#loadData", function() {
    it("creates a model of correct type if model specified", function() {
      const model = registry.loadData({ model: 'TestModel' })
      expect(model).toBeInstanceOf(TestModel)
    })
    
    it("returns null if specified model type is not found", function() {
      const model = registry.loadData({ model: 'Bacon' })
      expect(model).toBe(null)
    })

    it("returns null if no model type specified", function() {
      const model = registry.loadData({ foo: 'bar' })
      expect(model).toBe(null)
    })
  })
})
