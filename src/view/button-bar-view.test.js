import jQuery from 'jquery'

import { ButtonBarView } from './button-bar-view'

jQuery.fx.off = true;

describe('ButtonBarView', function() {
  let view

  beforeEach(function() {
    view = ButtonBarView.create();
  });
  
  describe("#init", () =>
    it("should set defaults", function() {
      expect(view._buttons).toEqual([]);
    })
  );
  
  describe("#button", () =>
    it("should add a button definition", function() {
      const fn = () => null;
      view.button('test', fn);
      expect(view._buttons.length).toEqual(1);
      expect(view._buttons[0].title).toEqual('test');
      expect(view._buttons[0].action).toBe(fn);
      expect(view._buttons[0].alternatives).toEqual([]);
    })
  );
  
  describe("#alternative", () =>
    it("should add an alternative to last button", function() {
      view.button('phony', () => null);
      view.button('primary', () => null);
      const fn = () => null;
      view.alternative('secondary', fn);
      expect(view._buttons[1].alternatives.length).toEqual(1);
      expect(view._buttons[1].alternatives[0].title).toEqual('secondary');
      expect(view._buttons[1].alternatives[0].action).toBe(fn);
    })
  );
  
  describe("#render", function() {
    it("should render a simple button", function() {
      view.button('test', () => null);
      view.render();
      expect(view.element().html()).toEqual('<span class=""><a href="javascript:;" class="button simple_button" data-index="0">test</a></span>');
    });
    
    it("should bind action to a simple button", function() {
      let clicked = false
      view.button('test', () => { clicked = true});
      view.render();
      jQuery('a', view.element()).click();
      expect(clicked).toBe(true)
    });
    
    it("should render a button with alternatives", function() {
      view.button('test', () => null);
      view.alternative('foo', () => null);
      view.render();
      expect(view.element().html()).toEqual('<span class=""><span class="alt_button"><a href="javascript:;" class="button alt_button_main " data-index="0">test</a><a href="javascript:;" class="button alt_button_more" data-index="0"><span class="dropdown">V</span></a></span></span>');
    });
  });
});
