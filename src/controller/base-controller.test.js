import { BaseController } from './base-controller'
import { BaseView } from '../view/base-view'

describe('BaseController', function() {
  let controller

  beforeEach(function() {
    controller = BaseController.create()
  })
  
  describe("#_viewChanged", function() {
    it("should unbind old view", function() {
      const view = BaseView.create()
      controller._view = view
      const unbindAll = jest.spyOn(view, 'unbindAll')
      controller.view(null)
      expect(unbindAll).toBeCalled()
    })
    
    it("should bind new view", function() {
      const view = BaseView.create()
      view.bind = jest.fn()
      controller.view(view)
      expect(view.bind.mock.calls.length).toEqual(2)
    })
  })
  
  describe("#viewLoaded", () =>
    it("should exist", function() {
      expect(controller.viewLoaded).toBeInstanceOf(Function)
    })
  )
  
  describe("#viewUnloaded", () =>
    it("should exist", function() {
      expect(controller.viewUnloaded).toBeInstanceOf(Function)
    })
  )
})
