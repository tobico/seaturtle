$ ->
  ST.Spec.describe "ViewHelper", ->
    beforeEach ->
      @helper = ST.ViewHelper.instance()
    
    it "should be a singleton", ->
      ST.ViewHelper.instance().should be(@helper)
    
    describe "#tag", ->
      it "should create a jQuery object", ->
        tag = @helper.tag('span')
        tag.should beAnInstanceOf jQuery
        
      it "should have the specified type", ->
        tag = @helper.tag('span')
        tag[0].tagName.should equal('SPAN')
    
    describe "#linkTag", ->
      it "should create an A tag", ->
        tag = @helper.linkTag 'Test', -> null
        tag[0].tagName.should equal('A')
      
      it "should have the specified text", ->
        tag = @helper.linkTag 'Test', -> null
        tag.html().should equal('Test')
      
      it "should call the supplied callback when link clicked", ->
        called = expectation 'to call callback'
        tag = @helper.linkTag 'Test', -> called.meet()
        tag.click()
    
    describe "#truncate", ->
      it "should pass through short text", ->
        @helper.truncate('bananas', 10).should equal('bananas')
      
      it "should truncate long text", ->
        @helper.truncate('bananas and pears', 10).should equal('bananas...')
    
    describe "#printHTML", ->
      it "can't be tested"