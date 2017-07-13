/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Controller
//= require ST/View

Spec.describe('Controller', function() {
  beforeEach(function() {
    return this.controller = ST.Controller.create();
  });
  
  describe("#_viewChanged", function() {
    it("should unbind old view", function() {
      const view = ST.View.create();
      this.controller._view = view;
      view.shouldReceive('unbindAll');
      return this.controller.view(null);
    });
    
    return it("should bind new view", function() {
      const view = ST.View.create();
      view.shouldReceive('bind').twice();
      return this.controller.view(view);
    });
  });
  
  describe("#viewLoaded", () =>
    it("should exist", function() {
      return this.controller.viewLoaded.should(beAFunction);
    })
  );
  
  return describe("#viewUnloaded", () =>
    it("should exist", function() {
      return this.controller.viewUnloaded.should(beAFunction);
    })
  );
});