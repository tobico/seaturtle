import { makeClass } from '../core/make-class'
import { BaseModel } from './base-model'
import { Model } from './model'
import { Scope } from './scope'
import { Index } from './index'
import { ModelRegistry } from './model-registry'

let NextUUID = 0
Model._generateUUID = () => NextUUID++

describe("BaseModel", function() {
  let registry, TestModel, model

  beforeEach(function() {
    registry = ModelRegistry.create()
    TestModel = makeClass('TestModel', BaseModel, (def) => {
      def.register(registry)
      def.string('foo', {default: 'bacon'})
      def.index('foo')
    })
    model = TestModel.create()
  })

  describe(".scoped", () =>
    it("should return a new scope", function() {
      const scope = TestModel.scoped()
      expect(scope).toBeInstanceOf(Scope)
    })
  )

  describe(".find", () =>
    it("should find model by uuid", function() {
      expect(TestModel.find(model.uuid())).toBe(model)
    })
  )

  describe(".load", function() {
    it("should create a new model with data", function() {
      const model = TestModel.load({uuid: 'test'})
      expect(model).toBeInstanceOf(TestModel)
      expect(model.uuid()).toEqual('test')
    })

    it("should load an array of models", function() {
      TestModel.load([
          {uuid: 'test-1'},
          {uuid: 'test-2'}
      ])
      expect(TestModel.find('test-1')).not.toBe(null)
      expect(TestModel.find('test-2')).not.toBe(null)
    })
  })

  describe(".index", function() {
    it("should create an index", function() {
      const index = TestModel.index('foo')
      expect(index).toBeInstanceOf(Index)
    })

    it("should existing index", function() {
      const index = TestModel.index('foo')
      expect(TestModel.index('foo')).toBe(index)
    })
  })

  describe(".saveToServer", () => it("should be tested"))

  describe("#init", () =>
    it("should call #initWithData", function() {
      const model = new TestModel()
      const initWithData = jest.spyOn(model, 'initWithData')
      model.init()
      expect(initWithData).toBeCalled
    })
  )

  describe("#initWithData", function() {
    beforeEach(function() {
      model = new TestModel()
    })

    it("should generate a new UUID", function() {
      Model._generateUUID = () => 'foo'
      model.initWithData({})
      expect(model.uuid()).toEqual('foo')
    })

    it("should accept an existing UUID", function() {
      model.initWithData({uuid: 'bar'})
      expect(model.uuid()).toEqual('bar')
    })

    it("should set attributes to their defaults", function() {
      model.initWithData({})
      expect(model.foo()).toEqual('bacon')
    })

    it("should load provided attributes", function() {
      model.initWithData({foo: 'waffles'})
      expect(model.foo()).toEqual('waffles')
    })

    it("should apply bindings on one-to-many associations")
  })

  describe(".createWithData", function() {
    it("should an existing object with same ID", function() {
      const model = TestModel.createWithData({uuid: 'recreate', foo: 'bacon'})
      const another = TestModel.createWithData({uuid: 'recreate', foo: 'waffles'})
      expect(another).toBe(model)
    })

    it("should create a new object", function() {
      const model = TestModel.createWithData({foo: 'bacon'})
      expect(model).toBeInstanceOf(TestModel)
    })
  })

  describe("#setUuid", function() {
    it("should add object to global index", function() {
      const model = new TestModel()
      model.uuid('test')
      expect(Model._byUuid['test']).toBe(model)
    })

    it("should add object to model index", function() {
      const model = new TestModel()
      model.uuid('test')
      expect(TestModel._byUuid['test']).toBe(model)
    })

    it("should do nothing if model already has ID", function() {
      const model = new TestModel()
      model._uuid = "test"
      model.uuid('test')
      expect(Model._byUuid['test']).not.toBe(model)
    })
  })

  describe("#matches", function() {
    it("should match when meets conditions", function() {
      expect(model.matches([TestModel.FIELDS.foo.equals('bacon')])).toBe(true)
    })

    it("should not match when fails condition", function() {
      expect(model.matches([TestModel.FIELDS.foo.equals('waffles')])).toBe(false)
    })
  })

  describe("#getManyList", () => it("needs to be tested"))

  describe("#data", () =>
    it("should data representation of object", function() {
      const data = model.data()
      expect(data).toBeInstanceOf(Object)
      expect(data.foo).toEqual('bacon')
    })
  )

  describe("#persist", () =>
    it("should save object in persistant storage", function() {
      Model._storage = { set: jest.fn() }
      model._uuid = 'test'
      model.persist()
      expect(Model._storage.set).toBeCalledWith('test', JSON.stringify(model.data()))
      delete Model._storage
    })
  )

  describe("#forget", function() {
    it("should remove object from global index", function() {
      const uuid = model.uuid()
      model.forget()
      expect(Model._byUuid[uuid]).toBe(undefined)
    })

    it("should remove object from model index", function() {
      const uuid = model.uuid()
      model.forget()
      expect(TestModel._byUuid[uuid]).toBe(undefined)
    })

    it("should remove object from attribute indexes", function() {
      let index = TestModel.index('foo')
      let remove = jest.spyOn(index, 'remove')
      model.forget()
      expect(remove).toBeCalledWith('bacon', model)
    })

    it("should remove from persistant storage", function() {
      Model._storage = { remove: jest.fn() }
      model._uuid = 'test'
      model.forget()
      expect(Model._storage.remove).toBeCalledWith('test')
      delete Model._storage
    })
  })

  describe("#destroy", () =>
    it("should forget object", function() {
      const forget = jest.spyOn(model, 'forget')
      model.destroy()
      expect(forget).toBeCalled()
    })
  )

  describe(".convertValueToType", function() {
    it("should convert to string", function() {
      const value = BaseModel.convertValueToType(10, { type: 'string' })
      expect(typeof value).toEqual('string')
    })

    it("should convert to real", function() {
      const value = BaseModel.convertValueToType('5.5', { type: 'real' })
      expect(typeof value).toEqual('number')
      expect(value).toEqual(5.5)
    })

    it("should convert to integer", function() {
      const value = BaseModel.convertValueToType('5.3', { type: 'integer' })
      expect(typeof value).toEqual('number')
      expect(value).toEqual(5)
    })

    it("should convert to datetime", function() {
      const value = BaseModel.convertValueToType('01 Jan 2010 12:15:00 UTC', { type: 'datetime' })
      expect(value).toBeInstanceOf(Date)
      expect(value.getTime()).toEqual(1262348100000)
    })

    it("should convert to bool", function() {
      const value = BaseModel.convertValueToType(17, { type: 'bool' })
      expect(value).toBe(true)
    })

    it("should not convert null", function() {
      const value = BaseModel.convertValueToType(null, { type: 'integer' })
      expect(value).toBe(null)
    })
  })

  describe(".attribute", function() {
    beforeEach(() => TestModel.attribute('bar', 'string', {default: 'bacon'}))

    it("should register default value for attribute", () => {
      expect(TestModel._attributes['bar'].default).toEqual('bacon')
    })

    it("should register type for attribute", () => {
      expect(TestModel._attributes['bar'].type).toEqual('string')
    })

    it("should create a getter method", function() {
      expect(model.getBar).toBeInstanceOf(Function)
    })

    it("should create a setter method", function() {
      expect(model.setBar).toBeInstanceOf(Function)
    })

    it("should create an accessor method", function() {
      expect(model.bar).toBeInstanceOf(Function)
    })

    describe("#set(Attribute)", function() {
      it("should set new value", function() {
        model.bar('waffles')
        expect(model.bar()).toEqual('waffles')
      })

      it("should update attribute index", function() {
        const index = TestModel.index('bar')
        model.bar('bacon')
        const remove = jest.spyOn(index, 'remove')
        const add = jest.spyOn(index, 'add')
        model.bar('waffles')
        expect(remove).toBeCalledWith('bacon', model)
        expect(add).toBeCalledWith('waffles', model)
      })

      it("should trigger _changed event", function() {
        model.bar('bacon')
        let _changed = jest.spyOn(model, '_changed')
        model.bar('waffles')
        expect(_changed).toBeCalledWith('bar', 'bacon', 'waffles')
      })
    })

    describe("#get(Attribute)", () =>
      it("should return attribute value", function() {
        model.bar('waffles')
        expect(model.getBar()).toEqual('waffles')
      })
    )

    it("should create matchers", function() {
      expect(TestModel.FIELDS.bar).not.toBe(null)
      expect(TestModel.FIELDS.bar.equals).toBeInstanceOf(Function)
    })

    describe("equals matcher", function() {
      let condition
      beforeEach(function() {
        condition = TestModel.FIELDS.bar.equals('bacon')
      })

      it("should have correct attribute name", function() {
        expect(condition.attribute).toEqual('bar')
      })

      it("should have correct value", function() {
        expect(condition.value).toEqual('bacon')
      })

      it("should test correct value", function() {
        expect(condition.test({bar: () => 'bacon'})).toBe(true)
      })

      it("should test incorrect value", function() {
        expect(condition.test({bar: () => 'waffles'})).toBe(false)
      })
    })
  })

  describe("with an associated model", function() {
    let OtherModel
    beforeEach(() => {
      OtherModel = makeClass('OtherModel', BaseModel, (def) => { def.register(registry) })
    })

    describe(".belongsTo", function() {
      beforeEach(() => {
        TestModel.belongsTo('other', { model: 'OtherModel' })
      })

      it("should create a Uuid attribute", function() {
        expect(model.otherUuid).toBeInstanceOf(Function)
      })

      it("should create a getter method", function() {
        expect(model.getOther).toBeInstanceOf(Function)
      })

      it("should create a setter method", function() {
        expect(model.setOther).toBeInstanceOf(Function)
      })

      it("should create an accessor method", function() {
        expect(model.other).toBeInstanceOf(Function)
      })

      it("should register virtual attribute", function() {
        const attr = TestModel._attributes['other']
        expect(attr.virtual).toBe(true)
        expect(attr.type).toEqual('belongsTo')
        expect(attr.model).toBe('OtherModel')
      })

      it("should apply bindings")

      describe("getter method", function() {
        it("should find object by uuid", function() {
          const other = OtherModel.create()
          model.otherUuid(other.uuid())
          expect(model.other()).toBe(other)
        })

        it("should be null when no uuid", function() {
          expect(model.other()).toBe(null)
        })

        it("should be null when no model with uuid", function() {
          model._attributes.otherUuid = 'nothing'
          expect(model.other()).toBe(null)
        })
      })

      describe("setter method", () =>
        it("should set uuid", function() {
          const other = OtherModel.create()
          model.other(other)
          expect(model.otherUuid()).toEqual(other.uuid())
        })
      )
    })

    describe(".hasMany", function() {
      beforeEach(() => {
        OtherModel.belongsTo('test', { model: 'TestModel' })
        TestModel.hasMany('others', { model: 'OtherModel', foreign: 'test'})
      })

      it("should create a getter method for scope", function() {
        expect(model.others).toBeInstanceOf(Function)
      })

      it("should store details of binding", function() {
        TestModel.hasMany('boundOthers', {
          model:    'OtherModel',
          foreign:  'test',
          bind:     { changed: 'otherChanged' }
        })
        expect(TestModel._manyBinds.length).toEqual(1)
        expect(TestModel._manyBinds[0].assoc).toEqual('boundOthers')
        expect(TestModel._manyBinds[0].from).toEqual('changed')
        expect(TestModel._manyBinds[0].to).toEqual('otherChanged')
      })

      describe("getter method", () =>
        it("should a scope with conditions to match foreign key", function() {
          const scope = model.others()
          expect(scope._model).toBe(OtherModel)
          expect(scope._conditions.length).toEqual(1)
          expect(scope._conditions[0].attribute).toEqual('testUuid')
        })
      )
    })
  })

  describe(".setStorage", function() {
    it("should set the persistant store")
    it("should save an existing model to persistant storage")
    it("should load a model from persistant storage")
  })
})
