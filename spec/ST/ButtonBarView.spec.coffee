#require ST/ButtonBarView

$.fx.off = true

Spec.describe 'ButtonBarView', ->
  beforeEach ->
    @view = ST.ButtonBarView.create()
  
  describe "#init", ->
    it "should set defaults", ->
      @view._buttons.should equal([])
  
  describe "#button", ->
    it "should add a button definition", ->
      fn = -> null
      @view.button 'test', fn
      @view._buttons.length.should equal(1)
      @view._buttons[0].title.should equal('test')
      @view._buttons[0].action.should be(fn)
      @view._buttons[0].alternatives.should equal([])
  
  describe "#alternative", ->
    it "should add an alternative to last button", ->
      @view.button 'phony', -> null
      @view.button 'primary', -> null
      fn = -> null
      @view.alternative 'secondary', fn
      @view._buttons[1].alternatives.length.should equal(1)
      @view._buttons[1].alternatives[0].title.should equal('secondary')
      @view._buttons[1].alternatives[0].action.should be(fn)
  
  describe "#render", ->
    it "should render a simple button", ->
      @view.button 'test', -> null
      @view.render()
      @view.element().should haveHtml('<a href="javascript:;" class="button simple_button" data-index="0">test</a>')
    
    it "should bind action to a simple button", ->
      clicked = expectation('click event fired')
      @view.button 'test', -> clicked.meet()
      @view.render()
      $('a', @view.element()).click()
    
    it "should render a button with alternatives", ->
      @view.button 'test', -> null
      @view.alternative 'foo', -> null
      @view.render()
      @view.element().should haveHtml('<span class="alt_button"><a href="javascript:;" class="button alt_button_main" data-index="0">test</a><a href="javascript:;" class="button alt_button_more" data-index="0"><span class="dropdown">V</span></a></span>')