#= require ST/View

ST.class 'DateTimeFieldView', 'FieldView', ->
  @initializer ->
    @super()
    @_dateElement = @_timeElement = null
  
  @method 'padNumber', (number) ->
    s = "#{number}"
    s = "0#{s}" if s.length == 1
    s
  
  @method 'isoDate', (date) ->
    items = date.split('/')
    if items.length == 3
      [items[2], @padNumber(items[1]), @padNumber(items[0])].join('-')
  
  @method 'isoTime', (time) ->
    if result = time.match /(\d\d?):(\d\d?)(am|pm)/i
      hour = Number result[1]
      hour = 0 if hour is 12
      hour += 12 if result[3].toLowerCase() is 'pm'
      minute = Number result[2]
      "#{@padNumber hour}:#{@padNumber minute}"
  
  @method 'render', ->
    @_dateElement = $ '<input type="text" class="text" style="width: 100px; margin-right: 15px" />'
    @_dateElement.val @dateValue(@_value)
    @_timeElement = $ '<input type="text" class="text" style="width: 100px" />'
    @_timeElement.val @timeValue(@_value)
    @element().append @_dateElement, @_timeElement
    $('input', @element()).bind 'click keyup change', @method('inputChanged')
    @_dateElement.calendricalDate()
    @_timeElement.calendricalTime()
  
  @method 'convertValue', (value) ->
    if value? then new Date(value) else null
  
  @method 'getInputValue', ->
    date = @isoDate(@_dateElement.val()) || ''
    time = @isoTime(@_timeElement.val()) || ''
    if time
      new Date "#{date}T#{time}"
    else if date
      new Date "#{date}T00:00"
  
  @method 'setInputValue', (value) ->
    @_dateElement.val @dateValue(value)
    @_timeElement.val @timeValue(value)
  
  @method 'dateValue', (value) ->
    date = value && value.toString 'd/M/yyyy'
    if date is '1/1/1970'
      ''
    else
      date
  
  @method 'timeValue', (value) ->
    time = value && value.toString('h:mmtt').toLowerCase()
    if time is '0:00am'
      ''
    else
      time