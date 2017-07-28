import { Scope } from './scope'
import { BaseModel } from './base-model'
import { Model } from './model'
import { makeClass } from '../core/make-class'

describe("Scope", function() {
  let TestModel, scope

  beforeEach(function() {
    let uuid = 1
    Model._generateUUID = () => uuid++
    
    TestModel = makeClass('TestModel', BaseModel, (def) => {
        def.string('foo', 'bacon')
        def.integer('cost', 1)
    })
    scope = TestModel.scoped()
  })
    
  describe("#initWithModel", function() {
    beforeEach(function() {
      scope = new Scope()
      scope.initWithModel(TestModel)
    })

    it("should set @_model", function() {
      expect(scope._model).toBe(TestModel)
    })
      
    it("should set defaults", function() {
      expect(scope._conditions).toEqual([])
      expect(scope._orders).toBe(null)
    })
  })
  
  describe("#initWithScope", function() {
    let condition, copy
    
    beforeEach(function() {
      condition = { attribute: 'foo', test: () => true }
      scope._conditions = [condition]
      scope._orders = ['foo']
      copy = Scope.createWithScope(scope)
    })
  
    it("should copy scope model", function() {
      expect(copy._model).toBe(scope._model)
    })
    
    it("should copy scope conditions", function() {
      expect(copy._conditions.length).toEqual(1)
      expect(copy._conditions[0]).toBe(condition)
    })
      
    it("should copy scope order", function() {
      expect(copy._orders).toEqual(['foo'])
    })
  })
  
  describe("#model", () =>
    it("should return model", function() {
      expect(scope.model()).toBe(TestModel)
    })
  )
  
  describe("#fork", function() {
    it("should copy scope", function() {
      const copy = scope.fork()
      expect(copy._model).toBe(TestModel)
    })
    
    it("should run block on new scope", function() {
      let copy, runBlock
      runBlock = false
      copy = scope.fork(() => runBlock = true)
      expect(runBlock).toBe(true)
    })
  })
  
  describe("#where", function() {
    it("should add conditions to fork of scope with no conditions", function() {
      const condition = {attribute: 'foo', test() { true } }
      const copy = scope.where(condition)
      expect(copy._conditions).toEqual([condition])
    })
    
    it("should combine conditions on fork of scope with conditions", function() {
      const condition1 = {attribute: 'foo', test() { true } }
      const condition2 = {attribute: 'bar', test() { false } }
      scope._conditions = [condition1]
      const copy = scope.where(condition2)
      expect(copy._conditions).toEqual([condition1, condition2])
    })
  })
  
  describe("#order", () =>
    it("should set order on fork of scope", function() {
      const copy = scope.order('foo')
      expect(copy._orders).toEqual(['foo'])
    })
  )

  describe("#enableBindings", () => it("should bind scope to a relevant attribute index"))
  
  describe("#each", function() {
    it("should iterate over items matched by scope", function() {
      const model = TestModel.createWithData({foo: 'bacon'})
      let found = false
      TestModel.where(TestModel.FIELDS.foo.equals('bacon')).each((item) => {
        found = true
        expect(item).toBe(model)
      })
      expect(found).toBe(true)
    })
  
    it("should iterate over items in order", function() {
      const model1 = TestModel.createWithData({foo: 'bacon', cost: 3})
      const model2 = TestModel.createWithData({foo: 'waffles', cost: 2})
      const model3 = TestModel.createWithData({foo: 'waffles', cost: 7})
      let found = 0
      let index = 0
      TestModel.order('cost').each((item) => {
        index++
        if (index === 1) { expect(item).toBe(model2) }
        if (index === 2) { expect(item).toBe(model1) }
        if (index === 3) { expect(item).toBe(model3) }
        found++
      })
      expect(found).toEqual(3)
    })
  })

  describe("#count", () =>
    it("should count number of items matched by scope", function() {
      const model = TestModel.createWithData({foo: 'bacon'})
      expect(TestModel.scoped().count()).toEqual(1)
    })
  )

  describe("#destroyAll", () =>
    it("should destroy all items matched by scope", function() {
      const model = TestModel.createWithData({foo: 'bacon'})
      TestModel.scoped().destroyAll()
      expect(TestModel.scoped().count()).toEqual(0)
    })
  )

  describe("#build", () =>
    it("should create a new object using scope conditions as base data", function() {
      const model = TestModel.where(TestModel.FIELDS.foo.equals('banana')).build()
      expect(model.foo()).toEqual('banana')
    })
  )

  describe("#indexItemAdded", function() {
    it("should trigger event if item matches scope")
    it("should do nothing if item doesn't match scope")
  })

  describe("#indexItemRemoved", function() {
    it("should trigger event if item matches scope")
    it("should do nothing if item doesn't match scope")
  })

  describe("#indexItemChanged", function() {
    it("should trigger event if item matches scope")
    it("should do nothing if item doesn't match scope")
  })
})
