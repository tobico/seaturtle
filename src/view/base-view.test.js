import { BaseView } from './base-view'
import { ViewHelper } from './view-helper'
import { List } from '../core/list'

describe("BaseView", function() {
  describe("#init", function() {
    it("should call #initWithElement", function() {
      const view = new BaseView()
      view.initWithElement = jest.fn()
      view.init()
      expect(view.initWithElement).toBeCalled()
    })
    
    it("should create a div tag", function() {
      const view = BaseView.create()
      expect(view.element()[0].tagName).toEqual('DIV')
    })
    
    it("should create a tag with view class name as a CSS class", function() {
      const view = BaseView.create()
      expect(view.element().is('.BaseView')).toBe(true)
    })
  })
  
  describe("#initWithElement", function() {
    let element, view

    beforeEach(function() {
      element = ViewHelper.instance().tag('view')
      view = BaseView.createWithElement(element)
    })
    
    it("should call super init", function() {
      expect(view._retainCount).toEqual(1)
    })
    
    it("should set element", function() {
      expect(view.element()).toBe(element)
    })
    
    it("should set defaults", function() {
      expect(view.loaded()).toBe(false)
    })
  })
  
  describe("with a new view", function() {
    let view

    beforeEach(function() {
      view = BaseView.create()
    })
    
    describe("#destroy", function() {
      it("should unload view", function() {
        view._loaded = true
        const unload = jest.spyOn(view, 'unload')
        view.destroy()
        expect(unload).toBeCalled()
      })
      
      it("should destroy all child views", function() {
        const children = view.children()
        children.add(BaseView.create())
        view.destroy()
        expect(children.count()).toEqual(0)
      })
      
      it("should unbind self from children list", function() {
        const children = view.children()
        view.destroy()
        expect(children._bindings.itemAdded.length).toEqual(0)
      })
      
      it("should remove element from DOM", function() {
        const element = view.element()
        const remove = jest.spyOn(element, 'remove')
        view.destroy()
        expect(remove).toBeCalled()
      })
    })
    
    describe("#helper", () =>
      it("should return ViewHelper", function() {
        expect(view.helper()).toBe(ViewHelper.instance())
      })
    )
    
    describe("#getChildren", function() {
      it("should create a children list if none exits", function() {
        expect(view.children()).toBeInstanceOf(List)
      })
      
      it("should bind to itemAdded event", function() {
        expect(view.children()._bindings.itemAdded.length).toEqual(1)
      })
        
      it("should bind to itemRemoved event", function() {
        expect(view.children()._bindings.itemRemoved.length).toEqual(1)
      })
    })
    
    describe("#setHeader", function() {
      describe("with a new header", function() {
        let header

        beforeEach(function() {
          header = BaseView.create()
        })
        
        it("should retain header", function() {
          const retain = jest.spyOn(header, 'retain')
          view.header(header)
          expect(retain).toBeCalled()
        })
        
        it("should load header if view loaded", function() {
          const load = jest.spyOn(header, 'load')
          view.load()
          view.header(header)
          expect(load).toBeCalled()
        })
        
        it("should add element at top of view if loaded", function() {
          view.load()
          view.element().append('<br />')
          view.setHeader(header)
          expect(view.element().children()[0]).toBe(header.element()[0])
        })
        
        it("should set _header attribute", function() {
          view.setHeader(header)
          expect(view._header).toBe(header)
        })
      })
      
      describe("with an old header", function() {
        let header

        beforeEach(function() {
          header = BaseView.create()
          view.header(header)
        })
          
        it("should release old header", function() {
          const release = jest.spyOn(header, 'release')
          view.header(null)
          expect(release).toBeCalled()
        })
        
        it("should detach element", function() {
          view.load()
          view.header(null)
          expect(view.element().children().length).toEqual(0)
        })
      })
    })
          
    describe("#setFooter", function() {
      describe("with a new footer", function() {
        let footer

        beforeEach(function() {
          footer = BaseView.create()
        })

        it("should retain footer", function() {
          const retain = jest.spyOn(footer, 'retain')
          view.footer(footer)
          expect(retain).toBeCalled()
        })

        it("should load footer if view loaded", function() {
          const load = jest.spyOn(footer, 'load')
          view.load()
          view.footer(footer)
          expect(load).toBeCalled()
        })

        it("should add element at bottom of view if loaded", function() {
          view.load()
          view.element().append('<br />')
          view.setFooter(footer)
          expect(view.element().children()[1]).toBe(footer.element()[0])
        })

        it("should set _footer attribute", function() {
          view.setFooter(footer)
          expect(view._footer).toBe(footer)
        })
      })

      describe("with an old footer", function() {
        let footer

        beforeEach(function() {
          footer = BaseView.create()
          view.footer(footer)
        })

        it("should release old footer", function() {
          const release = jest.spyOn(footer, 'release')
          view.footer(null)
          expect(release).toBeCalled()
        })

        it("should detach element", function() {
          view.load()
          view.footer(null)
          expect(view.element().children().length).toEqual(0)
        })
      })
    })
    
    describe("#childAdded", () =>
      describe("with a new child", function() {
        let child

        beforeEach(function() {
          child = BaseView.create()
        })
        
        it("should set child parent to view", function() {
          view.addChild(child)
          expect(child.parent()).toBe(view)
        })
        
        it("should add child element to bottom of view element if view loaded", function() {
          view.load()
          view.element().append('<br />')
          view.addChild(child)
          expect(view.element().children()[1]).toBe(child.element()[0])
        })
        
        it("should add child element after other children but before footer", function() {
          view.load()
          view.element().append('<br />')
          const footer = BaseView.create()
          view.footer(footer)
          view.addChild(child)
          expect(view.element().children()[1]).toBe(child.element()[0])
        })
      })
    )
    
    describe("#childRemoved", () =>
      it("should detach child element", function() {
        view.load()
        const child = BaseView.create()
        view.addChild(child)
        view.removeChild(child)
        expect(view.element().children().length).toEqual(0)
      })
    )
    
    describe("#load", function() {
      it("should trigger 'loading'", function() {
        const o = { loading: jest.fn() }
        view.bind('loading', o)
        view.load()
        expect(o.loading).toBeCalledWith(view)
      })
      
      describe("with a header", function() {
        let header

        beforeEach(function() {
          header = BaseView.create()
          view.header(header)
        })
        
        it("should load header", function() {
          const load = jest.spyOn(header, 'load')
          view.load()
          expect(load).toBeCalled()
        })
        
        it("should add header element to view element", function() {
          view.load()
          expect(view.element().children()[0]).toBe(header.element()[0])
        })
      })
      
      it("should render view", function() {
        view.render = jest.fn()
        view.load()
        expect(view.render).toBeCalled()
      })
      
      it("should load children", function() {
        view.loadChildren = jest.fn()
        view.load()
        expect(view.loadChildren).toBeCalled()
      })
      
      describe("with a footer", function() {
        let footer

        beforeEach(function() {
          footer = BaseView.create()
          view.footer(footer)
        })

        it("should load footer", function() {
          const load = jest.spyOn(view, 'load')
          view.load()
          expect(load).toBeCalled()
        })

        it("should add footer element to view element", function() {
          view.load()
          expect(view.element().children()[0]).toBe(footer.element()[0])
        })
      })
      
      it("should set loaded to true", function() {
        view.load()
        expect(view.loaded()).toBe(true)
      })
      
      it("should trigger 'loaded'", function() {
        const o = { loaded: jest.fn() }
        view.bind('loaded', o)
        view.load()
        expect(o.loaded).toBeCalledWith(view)
      })
    })
    
    describe("#loadChildren", () =>
      describe("with two children", function() {
        let child1, child2

        beforeEach(function() {
          child1 = BaseView.create()
          view.addChild(child1)
          child2 = BaseView.create()
          view.addChild(child2)
        })
      
        it("should load children", function() {
          const load1 = jest.spyOn(child1, 'load')
          const load2 = jest.spyOn(child2, 'load')
          view.load()
          expect(load1).toBeCalled()
          expect(load2).toBeCalled()
        })
      
        it("should add children elements to view element", function() {
          view.load()
          expect(view.element().children()[0]).toBe(child1.element()[0])
          expect(view.element().children()[1]).toBe(child2.element()[0])
        })
      })
    )
    
    describe("#unload", function() {
      beforeEach(function() {
        view.load()
      })
      
      it("should unload children", function() {
        const unloadChildren = jest.spyOn(view, 'unloadChildren')
        view.unload()
        expect(unloadChildren).toBeCalled()
      })
      
      it("should empty element", function() {
        view.element().append('test')
        view.unload()
        expect(view.element().children().length).toEqual(0)
      })
        
      it("should set loaded to false", function() {
        view.unload()
        expect(view.loaded()).toBe(false)
      })
    })
    
    describe("#unloadChildren", () => {
      let child1, child2

      it("should call unload and detach each child", function() {
        view.load()
        child1 = BaseView.create()
        child2 = BaseView.create()
        view.addChild(child1)
        view.addChild(child2)
        const unload1 = jest.spyOn(child1, 'unload')
        const unload2 = jest.spyOn(child2, 'unload')
        view.unloadChildren()
        expect(view.element().children().length).toEqual(0)
        expect(unload1).toBeCalled()
        expect(unload2).toBeCalled()
      })
    })
    
    describe("#reload", () =>
      it("shoud unload then load again", function() {
        view.load()
        const unload = jest.spyOn(view, 'unload')
        const load = jest.spyOn(view, 'load')
        view.reload()
        expect(unload).toBeCalled()
        expect(load).toBeCalled()
      })
    )
    
    describe("#show", function() {
      it("should load view if not loaded")
      
      it("should show view", function() {
        view.hide()
        view.show()
        expect(view.element()[0].style.display).not.toEqual('none')
      })
    })
    
    describe("#hide", () =>
      it("should hide view", function() {
        view.hide()
        expect(view.element().is(':hidden')).toBe(true)
      })
    )
  })
})
