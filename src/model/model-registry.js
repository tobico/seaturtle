import { makeClass } from '../core/make-class'
import { BaseObject } from '../core/base-object'
import { Model } from './model';

export const ModelRegistry = makeClass('ModelRegistry', BaseObject, (def) => {
  def.initializer(function() {
    this._models = {}
    this._byUuid = {}
  })

  def.method('registerModel', function(model, name) {
    this._models[name] = model
  })

  def.method('getModel', function(name) {
    return this._models[name]
  })

  def.method('getRecord', function(uuid) {
    return this._byUuid[uuid]
  })

  def.method('setRecord', function(uuid, record) {
    this._byUuid[uuid] = record
  })

  def.method('unsetRecord', function(uuid) {
    delete this._byUuid[uuid]
  })

  // Creates a new object from model data, loading the appropriate model class from the 'model' attribute
  def.method('loadData', function(data, options={}) {
    if (data.model) {
      let modelClass = this.getModel(data.model)
      if (modelClass) {
        return modelClass.createWithData(data, options)
      } else {
        return null
      }
    } else {
      return null
    }
  })

  def.method('unloadAll', function() {
    for (const key in this._models) {
      const model = this._models[key];
      delete model._master;
      delete model._indexes;
      delete model._byUuid;
    }
    this._byUuid = {};
  })
})
