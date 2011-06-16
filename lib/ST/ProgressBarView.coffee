#require ST/View

ST.class 'ProgressBarView', 'View', ->
  @initializer 'withTitleSteps', (title, steps) ->
    @init()
    @_title = title
    @_steps = steps
    @_progress = 0
    @_percent = null
    
  @property 'title'
  @property 'steps'
  
  @method 'render', ->
    percent = Math.round(@_progress * 100 / @_steps) + '%'
    if percent != @_percent
      @_percent = percent
      html = []
      html.push '<p>'
      html.push @title()
      html.push '</p><p class="progressBar"><span style="width: '
      html.push percent
      html.push ';">'
      html.push percent
      html.push '</span></p>'
      @element().html html.join('')

  @method 'reset', ->
    @_progress = 0
    @render() if @_loaded
  
  @method 'step', ->
    @_progress += 1
    @render() if @_loaded