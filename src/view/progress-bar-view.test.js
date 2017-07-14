import { ProgressBarView } from './progress-bar-view'

describe('ProgressBarView', function() {
  describe('#initWithTitleSteps', function() {
    let progressBar

    beforeEach(function() {
      progressBar = new ProgressBarView
      progressBar.initWithTitleSteps('Test', 25)
    })
    
    it("should save title and steps", function() {
      expect(progressBar._title).toEqual('Test')
      expect(progressBar._steps).toEqual(25)
    })
    
    it("should set defaults", function() {
      expect(progressBar._progress).toEqual(0)
      expect(progressBar._percent).toBe(null)
    })
  })
  
  describe("with a new progress bar", function() {
    let progressBar

    beforeEach(function() {
      progressBar = ProgressBarView.createWithTitleSteps('Test', 25)
    })
    
    describe("#render", function() {
      beforeEach(function() {
        progressBar.render()
      })
      
      it("should calculate percent", function() {
        expect(progressBar._percent).toEqual('0%')
      })
      
      it("should generate HTML for bar", function() {
        expect(progressBar.element().html()).toEqual('<p>Test</p><p class="progressBar"><span style="width: 0%;">0%</span></p>')
      })
    })
    
    describe("#reset", function() {
      it("should set progress to zero", function() {
        progressBar.reset()
        expect(progressBar._progress).toEqual(0)
      })
      
      it("should rerender", function() {
        progressBar.load()
        const render = jest.spyOn(progressBar, 'render')
        progressBar.reset()
        expect(render).toBeCalled()
      })
    })
        
    describe("#step", function() {
      it("should increase progress", function() {
        progressBar.step()
        expect(progressBar._progress).toEqual(1)
      })

      it("should rerender", function() {
        progressBar.load()
        const render = jest.spyOn(progressBar, 'render')
        progressBar.step()
        expect(render).toBeCalled()
      })
    })
  })
})
