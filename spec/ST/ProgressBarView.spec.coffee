#= require ST/ProgressBarView

Spec.describe 'ProgressBarView', ->
  describe '#initWithTitleSteps', ->
    beforeEach ->
      @progressBar = new ST.ProgressBarView
      @progressBar.initWithTitleSteps 'Test', 25
    
    it "should save title and steps", ->
      @progressBar._title.should equal('Test')
      @progressBar._steps.should equal(25)
    
    it "should set defaults", ->
      @progressBar._progress.should equal(0)
      expect(@progressBar._percent).to be(null)
  
  context "with a new progress bar", ->
    beforeEach ->
      @progressBar = ST.ProgressBarView.createWithTitleSteps 'Test', 25
    
    describe "#render", ->
      beforeEach ->
        @progressBar.render()
      
      it "should calculate percent", ->
        @progressBar._percent.should equal('0%')
      
      it "should generate HTML for bar", ->
        @progressBar.element().should haveHtml('<p>Test</p><p class="progressBar"><span style="width: 0%;">0%</span></p>')
    
    describe "#reset", ->
      it "should set progress to zero", ->
        @progressBar.reset()
        @progressBar._progress.should equal(0)
      
      it "should rerender", ->
        @progressBar.load()
        @progressBar.shouldReceive 'render'
        @progressBar.reset()
        
    describe "#step", ->
      it "should increase progress", ->
        @progressBar.step()
        @progressBar._progress.should equal(1)

      it "should rerender", ->
        @progressBar.load()
        @progressBar.shouldReceive 'render'
        @progressBar.step()