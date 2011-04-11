#require ST/View

$ ->
  Spec.describe "View", ->
    describe "#init", ->
      it "should call #initWithElement", ->
        view = new ST.View()
        view.shouldReceive 'initWithElement'
        view.init()
      
      it "should create a div tag", ->
        view = ST.View.create()
        view.element()[0].tagName.should equal('DIV')
      
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
      
      describe "#setHeader", ->
        context "with a new header", ->
          beforeEach ->
            @header = ST.View.create()
          
          it "should retain header", ->
            @header.shouldReceive 'retain'
            @view.header @header
          
          it "should load header if view loaded", ->
            @header.shouldReceive 'load'
            @view.load()
            @view.header @header
          
          it "should add element at top of view if loaded", ->
            @view.load()
            @view.element().append '<br />'
            @view.setHeader @header
            @view.element().children()[0].should be(@header.element()[0])
          
          it "should set _header attribute", ->
            @view.setHeader @header
            @view._header.should be(@header)
        
        context "with an old header", ->
          beforeEach ->
            @header = ST.View.create()
            @view.header @header
            
          it "should release old header", ->
            @header.shouldReceive 'release'
            @view.header null
          
          it "should detach element", ->
            @view.load()
            @view.header null
            @view.element().children().length.should equal(0)
            
      describe "#setFooter", ->
        context "with a new footer", ->
          beforeEach ->
            @footer = ST.View.create()

          it "should retain footer", ->
            @footer.shouldReceive 'retain'
            @view.footer @footer

          it "should load footer if view loaded", ->
            @footer.shouldReceive 'load'
            @view.load()
            @view.footer @footer

          it "should add element at bottom of view if loaded", ->
            @view.load()
            @view.element().append '<br />'
            @view.setFooter @footer
            @view.element().children()[1].should be(@footer.element()[0])

          it "should set _footer attribute", ->
            @view.setFooter @footer
            @view._footer.should be(@footer)

        context "with an old footer", ->
          beforeEach ->
            @footer = ST.View.create()
            @view.footer @footer

          it "should release old footer", ->
            @footer.shouldReceive 'release'
            @view.footer null

          it "should detach element", ->
            @view.load()
            @view.footer null
            @view.element().children().length.should equal(0)
      
      describe "#childAdded", ->
        context "with a new child", ->
          beforeEach ->
            @child = ST.View.create()
          
          it "should set child parent to view", ->
            @view.addChild @child
            @child.parent().should be(@view)
          
          it "should add child element to bottom of view element if view loaded", ->
            @view.load()
            @view.element().append('<br />')
            @view.addChild @child
            @view.element().children()[1].should be(@child.element()[0])
          
          it "should add child element after other children but before footer", ->
            @view.load()
            @view.element().append('<br />')
            footer = ST.View.create()
            @view.footer footer
            @view.addChild @child
            @view.element().children()[1].should be(@child.element()[0])
      
      describe "#childRemoved", ->
        it "should detach child element", ->
          @view.load()
          child = ST.View.create()
          @view.addChild child
          @view.removeChild child
          @view.element().children().length.should equal(0)
      
      describe "#load", ->
        it "should trigger 'loading'", ->
          o = {}
          o.shouldReceive('loading').with(@view)
          @view.bind 'loading', o
          @view.load()
        
        context "with a header", ->
          beforeEach ->
            @header = ST.View.create()
            @view.header @header
          
          it "should load header", ->
            @header.shouldReceive 'load'
            @view.load()
          
          it "should add header element to view element", ->
            @view.load()
            @view.element().children()[0].should be(@header.element()[0])
        
        it "should render view", ->
          @view.shouldReceive 'render'
          @view.load()
        
        it "should load children", ->
          @view.shouldReceive 'loadChildren'
          @view.load()
        
        context "with a footer", ->
          beforeEach ->
            @footer = ST.View.create()
            @view.footer @footer

          it "should load footer", ->
            @footer.shouldReceive 'load'
            @view.load()

          it "should add footer element to view element", ->
            @view.load()
            @view.element().children()[0].should be(@footer.element()[0])
        
        it "should set loaded to true", ->
          @view.load()
          @view.loaded().should beTrue
        
        it "should trigger 'loaded'", ->
          o = {}
          o.shouldReceive('loaded').with(@view)
          @view.bind 'loaded', o
          @view.load()
      
      describe "#loadChildren", ->
        context "with two children", ->
          beforeEach ->
            @child1 = ST.View.create()
            @view.addChild @child1
            @child2 = ST.View.create()
            @view.addChild @child2
        
          it "should load children", ->
            @child1.shouldReceive 'load'
            @child2.shouldReceive 'load'
            @view.load()
        
          it "should add children elements to view element", ->
            @view.load()
            @view.element().children()[0].should be(@child1.element()[0])
            @view.element().children()[1].should be(@child2.element()[0])
      
      describe "#unload", ->
        beforeEach ->
          @view.load()
        
        it "should unload children", ->
          @view.shouldReceive 'unloadChildren'
          @view.unload()
        
        it "should empty element", ->
          @view.element().append('test')
          @view.unload()
          @view.element().children().length.should equal(0)
          
        it "should set loaded to false", ->
          @view.unload()
          @view.loaded().should beFalse
      
      describe "#unloadChildren", ->
        it "should call unload and detach each child", ->
          @view.load()
          @child1 = ST.View.create()
          @child2 = ST.View.create()
          @view.addChild @child1
          @view.addChild @child2
          @child1.shouldReceive 'unload'
          @child2.shouldReceive 'unload'
          @view.unloadChildren()
          @view.element().children().length.should equal(0)
      
      describe "#reload", ->
        it "shoud unload then load again", ->
          @view.load()
          @view.shouldReceive 'unload'
          @view.shouldReceive 'load'
          @view.reload()
      
      describe "#show", ->
        it "should load view if not loaded", ->
          @view.show()
          @view.loaded().should beTrue
        
        it "should show view", ->
          @view.hide()
          @view.show()
          @view.element()[0].style.display.shouldNot equal('none')
      
      describe "#hide", ->
        it "should hide view", ->
          @view.hide()
          @view.element().is(':hidden').should beTrue