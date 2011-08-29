#= require ST/Controller
#= require ST/View

Spec.describe 'Controller', ->
  beforeEach ->
    @controller = ST.Controller.create()
  
  describe "#_viewChanged", ->
    it "should unbind old view", ->
      view = ST.View.create()
      @controller._view = view
      view.shouldReceive 'unbindAll'
      @controller.view null
    
    it "should bind new view", ->
      view = ST.View.create()
      view.shouldReceive('bind').twice()
      @controller.view view
  
  describe "#viewLoaded", ->
    it "should exist", ->
      @controller.viewLoaded.should beAFunction
  
  describe "#viewUnloaded", ->
    it "should exist", ->
      @controller.viewUnloaded.should beAFunction