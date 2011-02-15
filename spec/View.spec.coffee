$ ->
  ST.Spec.describe "View", ->
    describe "#init", ->
      it "should call #initWithElement", ->
        view = new ST.View()
        view.shouldReceive 'initWithElement'
        view.init()
      
      it "should create a view tag", ->
        view = ST.View.create()
        view.element()[0].tagName.should equal('VIEW')
      
      it "should create a tag with view class name as a CSS class", ->
        view = ST.View.create()
        view.element().is('.View').should beTrue
    
    describe "#initWithElement", ->
      beforeEach ->
        @element = ST.ViewHelper.instance().tag 'view'
        @view = ST.View.createWithElement @element
      
      it "should call super init", ->
        @view._retainCount.should equal(1)
      
      it "should set element", ->
        @view.element().should be(@element)
      
      it "should set defaults", ->
        @view.loaded().should beFalse
        @view.rendered().should beFalse
    
    context "with a new view", ->
      beforeEach ->
        @view = ST.View.create()
      
      describe "#destroy", ->
        it "should unload view", ->
          @view._loaded = true
          @view.shouldReceive 'unload'
          @view.destroy()
        
        it "should destroy all child views", ->
          children = @view.children()
          children.add ST.View.create()
          @view.destroy()
          children.count().should equal(0)
        
        it "should unbind self from children list", ->
          children = @view.children()
          @view.destroy()
          children._bindings.itemAdded.length.should equal(0)
        
        it "should release destructable properties", ->
          @view.shouldReceive('releaseProperties').with('children', 'header', 'footer')
          @view.destroy()
        
        it "should remove element from DOM", ->
          element = @view.element()
          element.shouldReceive 'remove'
          @view.destroy()
      
      describe "#helper", ->
        it "should return ViewHelper", ->
          @view.helper().should be(ST.ViewHelper.instance())
      
      describe "#getChildren", ->
        it "should create a children list if none exits", ->
          @view.children().should beAnInstanceOf(ST.List)
        
        it "should bind to itemAdded event", ->
          @view.children()._bindings.itemAdded.length.should equal(1)
          
        it "should bind to itemRemoved event", ->
          @view.children()._bindings.itemRemoved.length.should equal(1)