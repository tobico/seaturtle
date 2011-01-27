ST.class 'ProgressBar', 'View', ->
  @constructor 'withTitleSteps', (title, steps) ->
    @init()
    @title = title
    @steps = steps
    @progress = 0
    @percent = null
    
  @property 'title'
  @property 'steps'
  
  @method 'render', ->
    percent = Math.round(@progress * 100 / @steps) + '%'
    if percent != @percent
      @percent = percent
      @element.empty()
      @element.append('<p>' + @title + '</p>')
      @element.append('<p class="progressBar"><span style="width: ' + percent + '">' + percent + '</span></p>')

  @method 'reset', ->
    @progress = 0
    @render() if @loaded
  
  @method 'step', ->
    @progress += 1
    @render() if @loaded