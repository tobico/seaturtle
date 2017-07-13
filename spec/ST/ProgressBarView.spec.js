/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/ProgressBarView

Spec.describe('ProgressBarView', function() {
  describe('#initWithTitleSteps', function() {
    beforeEach(function() {
      this.progressBar = new ST.ProgressBarView;
      return this.progressBar.initWithTitleSteps('Test', 25);
    });
    
    it("should save title and steps", function() {
      this.progressBar._title.should(equal('Test'));
      return this.progressBar._steps.should(equal(25));
    });
    
    return it("should set defaults", function() {
      this.progressBar._progress.should(equal(0));
      return expect(this.progressBar._percent).to(be(null));
    });
  });
  
  return context("with a new progress bar", function() {
    beforeEach(function() {
      return this.progressBar = ST.ProgressBarView.createWithTitleSteps('Test', 25);
    });
    
    describe("#render", function() {
      beforeEach(function() {
        return this.progressBar.render();
      });
      
      it("should calculate percent", function() {
        return this.progressBar._percent.should(equal('0%'));
      });
      
      return it("should generate HTML for bar", function() {
        return this.progressBar.element().should(haveHtml('<p>Test</p><p class="progressBar"><span style="width: 0%;">0%</span></p>'));
      });
    });
    
    describe("#reset", function() {
      it("should set progress to zero", function() {
        this.progressBar.reset();
        return this.progressBar._progress.should(equal(0));
      });
      
      return it("should rerender", function() {
        this.progressBar.load();
        this.progressBar.shouldReceive('render');
        return this.progressBar.reset();
      });
    });
        
    return describe("#step", function() {
      it("should increase progress", function() {
        this.progressBar.step();
        return this.progressBar._progress.should(equal(1));
      });

      return it("should rerender", function() {
        this.progressBar.load();
        this.progressBar.shouldReceive('render');
        return this.progressBar.step();
      });
    });
  });
});