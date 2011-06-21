#require ST/View
#require Popup

ST.class 'TableView', 'View', ->
  @GroupingEnabled = false
  @Instances = []
  
  @initializer 'withList', (list) ->
    @init()
    ST.TableView.Instances.push this
    @_id = ST.TableView.Instances.length - 1
    @_rowsByUid = {}
    @_columns = []
    @_ordered = []
    @_sortColumn = null
    @_reverseSort = false
    @_tableClass = null
    @_tableElement = null
    @_canCustomizeColumns = true
    @list list
    
  @property 'columns'
  @property 'list'
  @property 'sortColumn'
  @property 'reverseSort'
  @property 'tableClass'
  @property 'tableElement'
  @property 'canCustomizeColumns'
  
  @destructor ->
    ST.TableView.Instances[@_id] = null
    @super()
  
  @method 'setList', (newList) ->
    self = this
    unless newList == @list    
      if @_list
        @_list.unbindAll this
      
      @_list = newList
      
      if @_list
        @_list.each (item) ->
          item._uid ||= ST.Object.UID++
          self._ordered.push item
        @_list.bind 'itemAdded', this, 'listItemAdded'
        @_list.bind 'itemChanged', this, 'listItemChanged'
        @_list.bind 'itemRemoved', this, 'listItemRemoved'

  @method 'setColumns', (columns, sortColumnIndex=0) ->
    @_columns = columns
    for column, i in columns
      column.index = i
    @sortColumn sortColumnIndex if columns.length > sortColumnIndex && @_sortColumn isnt columns[sortColumnIndex]
    if @_loaded
      @refreshHeader()
      @refreshBody()
    
  @method 'sortFunction', (sortColumn) ->
    self = this
    if column = sortColumn || @_sortColumn
      if column.sortBy
        ST.makeSortFn column.sortBy, @_reverseSort
      else if column.sort
        if @_reverseSort
          (a, b) -> column.sort b, a
        else
          column.sort
      else
        ST.makeSortFn (item) ->
          self.cellValue item, column
        , @_reverseSort

  @method 'setSortColumn', (sortColumn, reverseSort) ->
    self = this
    sortColumn = @_columns[sortColumn] if typeof sortColumn == 'number'
    
    oldSortColumn = @_sortColumn
    
    @_reverseSort = reverseSort if reverseSort isnt undefined
      
    if oldSortColumn == sortColumn
      @_reverseSort = !@_reverseSort
    else
      @_reverseSort = !!(sortColumn && sortColumn.reverse)
      
    @_sortColumn = sortColumn
    
    @sort()
    
    @refreshHeader() if @_loaded
  
  @method 'sort', ->
    self = this
    if sortFunction = @sortFunction()
      @_ordered.sort sortFunction
      if @_loaded
        for item in @_ordered
          @_tbody.append @_rowsByUid[item._uid]
  
  @method 'rowFor', (item) ->
    item && item._uid && @_rowsByUid[item._uid]
  
  @method 'render', ->
    @renderTable()
    @element().append @_tableElement
    @renderColumnsButton() if @_canCustomizeColumns
  
  @method 'renderTable', ->
    self = this
    @_tableElement = @helper().tag('table').addClass('tableView')
    @_tableElement.addClass @_tableClass if @_tableClass
    html = []
    @generateTableHTML html
    @_tableElement.html html.join('')
    @_tbody = $ 'tbody', @_tableElement
    $('tr', @_tbody).each (index) ->
      self._rowsByUid[self._ordered[index]._uid] = this
    @activateBody()
  
  @method 'renderColumnsButton', ->
    @element().append '<a class="columnsButton" onmouseover="$(this).addClass(\'columnsButtonHover\')" onmouseout="$(this).removeClass(\'columnsButtonHover\')" href="javascript:;">C</a>'
    $('.columnsButton', @element()).popup @method('generateColumnsPopup')
  
  @method 'positionColumnsButton', ->
    if @_loaded
      self = this
      setTimeout(->
        $('.columnsButton', self._element).css 'top', self._tableElement.position().top
      , 1)

  @method 'generateTableHTML', (html, rows=null, media='screen') ->
    html.push '<thead>'
    @generateHeaderInnerHTML html, media
    html.push '</thead><tbody>'
    @generateBodyInnerHTML html, rows, media
    html.push '</tbody>'
  
  @method 'generateHeaderInnerHTML', (html, media='screen') ->
    html.push '<tr>'
    for column in @_columns
      unless column.hidden or (column.media and column.media != media)
        @generateColumnHeaderHTML column, html, media
    html.push '</tr>'
  
  @method 'generateColumnHeaderHTML', (column, html, media='screen') ->
    html.push '<th style="cursor:pointer" onclick="ST.TableView.Instances[' + @_id + '].setSortColumn(' + column.index + ')">'
    html.push column.title
    
    if media == 'screen' && column == @_sortColumn
      html.push '<span class="sortLabel">'
      if @_reverseSort
        html.push ' &#x2191;' 
      else
        html.push ' &#x2193;'
      html.push '</span>'
    
    html.push '</th>'
  
  @method 'generateBodyInnerHTML', (html, rows=null, media='screen') ->
    self = this
    rows ||= @_ordered
    for item in rows
      self.generateRowHTML item, html, media
  
  @method 'activateBody', ->
    @_list.each @method('activateRow')
  
  @method 'generateRowHTML', (item, html, media='screen') ->
    html.push '<tr data-uid="', item._uid, '">'
    @generateRowInnerHTML item, html, media
    html.push '</tr>'

  @method 'generateRowInnerHTML', (item, html, media='screen') ->
    for column in @_columns      
      unless column.hidden or (column.media and column.media != media)
        html.push '<td>'
        html.push(
          if column.html
            column.html item, media
          else
            @cellValue item, column, media
        )
        html.push '</td>'
  
  @method 'activateRow', (item) ->
    cells = $ "td", @_rowsByUid[item._uid]
    i = 0
    for column in @_columns      
      unless column.hidden or (column.media and column.media != 'screen')
        column.activate item, cells[i] if column.activate && cells[i]
        i++
  
  @method 'cellValue', (item, column, media='screen') ->
    if column.value
      column.value item, media
    else if column.field
      if item && item.get
        item.get column.field
      else if item
        item[column.field]
  
  @method 'refreshTable', ->
    if @_loaded
      @refreshHeader()
      @refreshBody()
  
  @method 'refreshHeader', ->
    if @_loaded
      thead = $ 'thead', @_tableElement
      html = []
      @generateHeaderInnerHTML html
      thead.html html.join('')

  @method 'refreshBody', ->
    if @_loaded
      html = []
      @generateBodyInnerHTML html
      @_tbody.html html.join('')
      @activateBody()
  
  @method 'refreshRow', (item) ->
    if row = @_rowsByUid[item._uid]
      html = []
      @generateRowInnerHTML item, html
      $(row).html html.join('')
      @activateRow item
  
  @method 'toggleColumn', (column) ->
    column.hidden = !column.hidden
    @refreshHeader()
    @refreshBody()
      
  @method 'generateColumnsPopup', ->
    self = this
    a = []
    for column in @_columns
      unless (column.media && column.media != 'screen') || column.fixed
        a.push {
          title:  column.fullTitle || column.title
          action: ((column) -> -> self.toggleColumn column)(column)
          className: if column.hidden then 'unchecked' else 'checked'
        }
    a
  
  @method 'listItemAdded', (list, item) ->  
    item._uid ||= ST.Object.UID++
    @_ordered.push item

    if @_loaded
      html = []
      @generateRowHTML item, html
      @_tbody.append html.join('')
      @_rowsByUid[item._uid] = $ 'tr:last-child', @_tbody
      @activateRow item
      ST.once "sort#{@_uid}", @method('sort')
  
  @method 'listItemRemoved', (list, item) ->
    if (index = @_ordered.indexOf(item))?
      @_ordered.splice index, 1
    
    if row = @_rowsByUid[item._uid]
      $(row).remove()
      delete @_rowsByUid[item._uid]
  
  @method 'listItemChanged', (list, item) ->
    if @_loaded
      @refreshRow item
      ST.once "sort#{@_uid}", @method('sort')
  
  @method 'generatePrintHTML', (html, options={}) ->
    rows = @_ordered.slice(0)
    rows.sort @sortFunction(options.sortColumn)
    html.push '<table class="tableView">'
    @generateTableHTML html, rows, 'print'
    html.push '</table>'

  @method 'print', (options={}) ->
    html = []
    html.push '<h2>', options.heading, '</h2>' if options.heading
    @generatePrintHTML html, options
    @helper().print html.join(''), options
  
  @method '_headerChanged', (oldValue, newValue) ->
    @super oldValue, newValue
    @positionColumnsButton() if @_loaded