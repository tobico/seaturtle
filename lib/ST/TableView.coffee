#require ST/View
#require Popup

ST.class 'TableView', 'View', ->
  @GroupingEnabled = false
  @Instances = []
  
  @initializer 'withList', (list) ->
    @init()
    ST.TableView.Instances.push this
    @_id = ST.TableView.Instances.length - 1
    @_columns = []
    @_mapping = []
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
    unless newList == @list    
      if @_list
        @_list.unbindAll this
    
      @_list = newList
      
      @createMapping()
    
      if @_list
        @_list.bind 'itemAdded', this, 'listItemAdded'
        @_list.bind 'itemChanged', this, 'listItemChanged'
        @_list.bind 'itemRemoved', this, 'listItemRemoved'
  
  @method 'createMapping', ->
    self = this
    @_mapping = []
    if @_list
      i = 0
      @_list.each (item) ->
        self._mapping.push i++

  @method 'setColumns', (columns, sortColumnIndex=0) ->
    @_columns = columns
    for column, i in columns
      column.index = i
    @sortColumn sortColumnIndex if columns.length > sortColumnIndex
    if @_loaded
      @refreshBody()
    
  @method 'sortFunction', (sortColumn) ->
    self = this
    if column = sortColumn || @_sortColumn
      sortFn = null
      sortFn ||= column.sort
      sortFn = ST.makeSortFn column.sortBy if column.sortBy
    
      if sortFn
        if @_reverseSort
          (a, b) -> sortFn self._list.at(b), self._list.at(a)
        else
          (a, b) -> sortFn self._list.at(a), self._list.at(b)
      else
        ST.makeSortFn (index) ->
          self.cellValue self._list.at(index), column
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
      @_mapping.sort sortFunction
      if @_loaded
        tbody = $('tbody', @_tableElement)
        for index in @_mapping
          tbody.append $('tr.item' + index, @_tableElement)
    
  @method 'render', ->
    @renderTable()
    @element().append @_tableElement
    @renderColumnsButton() if @_canCustomizeColumns
  
  @method 'renderTable', ->
    @_tableElement = @helper().tag('table').addClass('tableView')
    @_tableElement.addClass @_tableClass if @_tableClass
    html = []
    @generateHeaderHTML html
    @generateBodyHTML html
    @_tableElement.html html.join('')
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

  @method 'generateHeaderHTML', (html, media='screen') ->
    html.push '<thead>'
    @generateHeaderInnerHTML html, media
    html.push '</thead>'
  
  @method 'generateHeaderInnerHTML', (html, media='screen') ->
    html.push '<tr>'
    for column in @_columns
      unless column.hidden or (column.media and column.media != media)
        @generateColumnHeaderHTML column, html, media
    html.push '</tr>'
  
  @method 'generateColumnHeaderHTML', (column, html, media='screen') ->
    html.push '<th style="cursor:pointer" onclick="ST.TableView.Instances[' + @_id + '].setSortColumn(' + column.index + ')">'
    html.push column.title
    
    if column == @_sortColumn
      html.push '<span class="sortLabel">'
      if @_reverseSort
        html.push ' &#x2191;' 
      else
        html.push ' &#x2193;'
      html.push '</span>'
    
    html.push '</th>'
  
  @method 'generateBodyHTML', (html, media='screen') ->
    html.push '<tbody>'
    @generateBodyInnerHTML html, media
    html.push '</tbody>'
  
  @method 'generateBodyInnerHTML', (html, media='screen') ->
    self = this
    for index in @_mapping
      self.generateRowHTML @_list.at(index), index, html, media
  
  @method 'activateBody', ->
    self = this
    index = 0
    @_list.eachAsync((item) ->
      self.activateRow item, index++
    , {iteration: 5})
  
  @method 'generateRowHTML', (item, index, html, media='screen') ->
    html.push '<tr class="item', index, '">'
    @generateRowInnerHTML item, html, media
    html.push '</tr>'

  @method 'generateRowInnerHTML', (item, html, media='screen') ->
    for column in @_columns      
      unless column.hidden or (column.media and column.media != media)
        @generateCellHTML item, column, html, media
  
  @method 'activateRow', (item, index) ->
    cells = $("tr.item#{index} td", @_tableElement)
    i = 0
    for column in @_columns      
      unless column.hidden or (column.media and column.media != 'screen')
        column.activate item, cells[i] if column.activate && cells[i]
        i++
  
  @method 'generateCellHTML', (item, column, html, media='screen') ->
    html.push '<td>'
    @generateCellInnerHTML item, column, html, media
    html.push '</td>'
  
  @method 'generateCellInnerHTML', (item, column, html, media='screen') ->
    html.push(
      if column.html
        column.html item, media
      else
        @cellValue item, column, media
    )
  
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
      tbody = $ 'tbody', @_tableElement
      html = []
      @generateBodyInnerHTML html
      tbody.html html.join('')
      @activateBody()
  
  @method 'refreshRow', (item) ->
    if @_loaded
      row = @row item
      if row.length
        html = []
        @generateRowInnerHTML item, html
        row.html html.join('')
        @activateRow item, @_list.indexOf(item)
  
  @method 'row', (item) ->
    index = @_list.indexOf item
    row = $('tr.item' + index, @_tableElement)
  
  @method 'toggleColumn', (column) ->
    column.hidden = !column.hidden
    @refreshHeader()
    @refreshBody()
      
  @method 'generateColumnsPopup', ->
    self = this
    a = []
    for column in @_columns
      unless column.media && column.media != 'screen'
        data = {
          title:  column.fullTitle || column.title
          action: ((column) -> -> self.toggleColumn column)(column)
        }
        data.title = '&#x2714; ' + data.title unless column.hidden
        a.push data
    a
  
  @method 'listItemAdded', (list, item, index) ->
    return unless @_loaded
    
    insertBefore = 0
    sortFn = @sortFunction()
    tbody = $ 'tbody', @_tableElement
    html = []
    @generateRowHTML item, index, html
    tbody.append html.join('')
    @activateRow item, index
    @_mapping.push index
    @sort()
  
  @method 'listItemRemoved', (list, item, index) ->
    if @_loaded
      $('tr.item' + index, @_tableElement).remove()
      last = @_list.count() - 1
      if index <= last
        for i in [index..last]
          row = $('tr.item' + (i+1), @_tableElement)
          row[0].className = "item#{i}" if row.length
      @createMapping()
      @sort()
  
  @method 'listItemChanged', (list, item) ->
    if @_loaded
      @refreshRow item
      @sort()
  
  @method 'generatePrintHTML', (html, options={}) ->
    oldMapping = @_mapping
    oldSortColumn = @_sortColumn
    if options.sortColumn
      @_sortColumn = options.sortColumn
      @_mapping = oldMapping.slice(0)
      if sortFunction = @sortFunction()
        @_mapping.sort sortFunction
    
    html.push '<table class="tableView">'
    @generateHeaderHTML html, 'print'
    @generateBodyHTML html, 'print'
    html.push '</table>'
    
    @_mapping = oldMapping
    @_sortColumn = @_sortColumn

  @method 'print', (options={}) ->
    html = []
    html.push '<h2>', options.heading, '</h2>' if options.heading    
    @helper().print html.join(''), options
  
  @method '_headerChanged', (oldValue, newValue) ->
    @super oldValue, newValue
    @positionColumnsButton() if @_loaded