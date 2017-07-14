import { makeClass } from '../core/make-class'
import { BaseObject } from '../core/base-object'

export const ModelRegistry = makeClass('ModelRegistry', BaseObject, (def) => {
  def.initializer(function() {
    this._models = {}
  })

  def.method('registerModel', function(model, name) {
    this._models[name] = model
  })

  def.method('getModel', function(name) {
    return this._models[name]
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
})
