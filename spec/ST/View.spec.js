/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/View

Spec.describe("View", function() {
  describe("#init", function() {
    it("should call #initWithElement", function() {
      const view = new ST.View();
      view.shouldReceive('initWithElement');
      return view.init();
    });
    
    it("should create a div tag", function() {
      const view = ST.View.create();
      return view.element()[0].tagName.should(equal('DIV'));
    });
    
    return it("should create a tag with view class name as a CSS class", function() {
      const view = ST.View.create();
      return view.element().is('.View').should(beTrue);
    });
  });
  
  describe("#initWithElement", function() {
    beforeEach(function() {
      this.element = ST.ViewHelper.instance().tag('view');
      return this.view = ST.View.createWithElement(this.element);
    });
    
    it("should call super init", function() {
      return this.view._retainCount.should(equal(1));
    });
    
    it("should set element", function() {
      return this.view.element().should(be(this.element));
    });
    
    return it("should set defaults", function() {
      return this.view.loaded().should(beFalse);
    });
  });
  
  return context("with a new view", function() {
    beforeEach(function() {
      return this.view = ST.View.create();
    });
    
    describe("#destroy", function() {
      it("should unload view", function() {
        this.view._loaded = true;
        this.view.shouldReceive('unload');
        return this.view.destroy();
      });
      
      it("should destroy all child views", function() {
        const children = this.view.children();
        children.add(ST.View.create());
        this.view.destroy();
        return children.count().should(equal(0));
      });
      
      it("should unbind self from children list", function() {
        const children = this.view.children();
        this.view.destroy();
        return children._bindings.itemAdded.length.should(equal(0));
      });
      
      return it("should remove element from DOM", function() {
        const element = this.view.element();
        element.shouldReceive('remove');
        return this.view.destroy();
      });
    });
    
    describe("#helper", () =>
      it("should return ViewHelper", function() {
        return this.view.helper().should(be(ST.ViewHelper.instance()));
      })
    );
    
    describe("#getChildren", function() {
      it("should create a children list if none exits", function() {
        return this.view.children().should(beAnInstanceOf(ST.List));
      });
      
      it("should bind to itemAdded event", function() {
        return this.view.children()._bindings.itemAdded.length.should(equal(1));
      });
        
      return it("should bind to itemRemoved event", function() {
        return this.view.children()._bindings.itemRemoved.length.should(equal(1));
      });
    });
    
    describe("#setHeader", function() {
      context("with a new header", function() {
        beforeEach(function() {
          return this.header = ST.View.create();
        });
        
        it("should retain header", function() {
          this.header.shouldReceive('retain');
          return this.view.header(this.header);
        });
        
        it("should load header if view loaded", function() {
          this.header.shouldReceive('load');
          this.view.load();
          return this.view.header(this.header);
        });
        
        it("should add element at top of view if loaded", function() {
          this.view.load();
          this.view.element().append('<br />');
          this.view.setHeader(this.header);
          return this.view.element().children()[0].should(be(this.header.element()[0]));
        });
        
        return it("should set _header attribute", function() {
          this.view.setHeader(this.header);
          return this.view._header.should(be(this.header));
        });
      });
      
      return context("with an old header", function() {
        beforeEach(function() {
          this.header = ST.View.create();
          return this.view.header(this.header);
        });
          
        it("should release old header", function() {
          this.header.shouldReceive('release');
          return this.view.header(null);
        });
        
        return it("should detach element", function() {
          this.view.load();
          this.view.header(null);
          return this.view.element().children().length.should(equal(0));
        });
      });
    });
          
    describe("#setFooter", function() {
      context("with a new footer", function() {
        beforeEach(function() {
          return this.footer = ST.View.create();
        });

        it("should retain footer", function() {
          this.footer.shouldReceive('retain');
          return this.view.footer(this.footer);
        });

        it("should load footer if view loaded", function() {
          this.footer.shouldReceive('load');
          this.view.load();
          return this.view.footer(this.footer);
        });

        it("should add element at bottom of view if loaded", function() {
          this.view.load();
          this.view.element().append('<br />');
          this.view.setFooter(this.footer);
          return this.view.element().children()[1].should(be(this.footer.element()[0]));
        });

        return it("should set _footer attribute", function() {
          this.view.setFooter(this.footer);
          return this.view._footer.should(be(this.footer));
        });
      });

      return context("with an old footer", function() {
        beforeEach(function() {
          this.footer = ST.View.create();
          return this.view.footer(this.footer);
        });

        it("should release old footer", function() {
          this.footer.shouldReceive('release');
          return this.view.footer(null);
        });

        return it("should detach element", function() {
          this.view.load();
          this.view.footer(null);
          return this.view.element().children().length.should(equal(0));
        });
      });
    });
    
    describe("#childAdded", () =>
      context("with a new child", function() {
        beforeEach(function() {
          return this.child = ST.View.create();
        });
        
        it("should set child parent to view", function() {
          this.view.addChild(this.child);
          return this.child.parent().should(be(this.view));
        });
        
        it("should add child element to bottom of view element if view loaded", function() {
          this.view.load();
          this.view.element().append('<br />');
          this.view.addChild(this.child);
          return this.view.element().children()[1].should(be(this.child.element()[0]));
        });
        
        return it("should add child element after other children but before footer", function() {
          this.view.load();
          this.view.element().append('<br />');
          const footer = ST.View.create();
          this.view.footer(footer);
          this.view.addChild(this.child);
          return this.view.element().children()[1].should(be(this.child.element()[0]));
        });
      })
    );
    
    describe("#childRemoved", () =>
      it("should detach child element", function() {
        this.view.load();
        const child = ST.View.create();
        this.view.addChild(child);
        this.view.removeChild(child);
        return this.view.element().children().length.should(equal(0));
      })
    );
    
    describe("#load", function() {
      it("should trigger 'loading'", function() {
        const o = new SpecObject();
        o.shouldReceive('loading').with(this.view);
        this.view.bind('loading', o);
        return this.view.load();
      });
      
      context("with a header", function() {
        beforeEach(function() {
          this.header = ST.View.create();
          return this.view.header(this.header);
        });
        
        it("should load header", function() {
          this.header.shouldReceive('load');
          return this.view.load();
        });
        
        return it("should add header element to view element", function() {
          this.view.load();
          return this.view.element().children()[0].should(be(this.header.element()[0]));
        });
      });
      
      it("should render view", function() {
        this.view.shouldReceive('render');
        return this.view.load();
      });
      
      it("should load children", function() {
        this.view.shouldReceive('loadChildren');
        return this.view.load();
      });
      
      context("with a footer", function() {
        beforeEach(function() {
          this.footer = ST.View.create();
          return this.view.footer(this.footer);
        });

        it("should load footer", function() {
          this.footer.shouldReceive('load');
          return this.view.load();
        });

        return it("should add footer element to view element", function() {
          this.view.load();
          return this.view.element().children()[0].should(be(this.footer.element()[0]));
        });
      });
      
      it("should set loaded to true", function() {
        this.view.load();
        return this.view.loaded().should(beTrue);
      });
      
      return it("should trigger 'loaded'", function() {
        const o = new SpecObject();
        o.shouldReceive('loaded').with(this.view);
        this.view.bind('loaded', o);
        return this.view.load();
      });
    });
    
    describe("#loadChildren", () =>
      context("with two children", function() {
        beforeEach(function() {
          this.child1 = ST.View.create();
          this.view.addChild(this.child1);
          this.child2 = ST.View.create();
          return this.view.addChild(this.child2);
        });
      
        it("should load children", function() {
          this.child1.shouldReceive('load');
          this.child2.shouldReceive('load');
          return this.view.load();
        });
      
        return it("should add children elements to view element", function() {
          this.view.load();
          this.view.element().children()[0].should(be(this.child1.element()[0]));
          return this.view.element().children()[1].should(be(this.child2.element()[0]));
        });
      })
    );
    
    describe("#unload", function() {
      beforeEach(function() {
        return this.view.load();
      });
      
      it("should unload children", function() {
        this.view.shouldReceive('unloadChildren');
        return this.view.unload();
      });
      
      it("should empty element", function() {
        this.view.element().append('test');
        this.view.unload();
        return this.view.element().children().length.should(equal(0));
      });
        
      return it("should set loaded to false", function() {
        this.view.unload();
        return this.view.loaded().should(beFalse);
      });
    });
    
    describe("#unloadChildren", () =>
      it("should call unload and detach each child", function() {
        this.view.load();
        this.child1 = ST.View.create();
        this.child2 = ST.View.create();
        this.view.addChild(this.child1);
        this.view.addChild(this.child2);
        this.child1.shouldReceive('unload');
        this.child2.shouldReceive('unload');
        this.view.unloadChildren();
        return this.view.element().children().length.should(equal(0));
      })
    );
    
    describe("#reload", () =>
      it("shoud unload then load again", function() {
        this.view.load();
        this.view.shouldReceive('unload');
        this.view.shouldReceive('load');
        return this.view.reload();
      })
    );
    
    describe("#show", function() {
      it("should load view if not loaded");
      
      return it("should show view", function() {
        this.view.hide();
        this.view.show();
        return this.view.element()[0].style.display.shouldNot(equal('none'));
      });
    });
    
    return describe("#hide", () =>
      it("should hide view", function() {
        this.view.hide();
        return this.view.element().is(':hidden').should(beTrue);
      })
    );
  });
});