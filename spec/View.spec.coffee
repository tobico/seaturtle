$ ->
  ST.Spec.describe "View", ->
    describe "#init", ->
      it "should call #initWithElement", ->
        view = new ST.View()
        view.shouldReceive 'initWithElement'
        view.init()