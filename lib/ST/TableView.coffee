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
    @list list
    @_sortColumn = null
    @_reverseSort = false
    @_tableClass = null
    @_tableElement = null
    @_canCustomizeColumns = true
    
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
      @_mapping = []
    
      if @_list
        @_list.bind 'itemAdded', this, 'listItemAdded'
        @_list.bind 'itemChanged', this, 'listItemChanged'
        @_list.bind 'itemRemoved', this, 'listItemRemoved'
        i = 0
        @_list.each (item) ->
          self._mapping.push i++

  @method 'setColumns', (columns, sortColumnIndex=0) ->
    @_columns = columns
    for column, i in columns
      column.index = i
    @sortColumn sortColumnIndex unless @_sortColumn or !columns.length
    if @_loaded
      @refreshHeader()
      @refreshBody()
    
  @method 'sortFunction', (sortColumn) ->
    self = this
    column = sortColumn || @_sortColumn
    
    if column.sort
      if @_reverseSort
        (a, b) -> column.sort self.list.at(b), self.list.at(a)
      else
        (a, b) -> column.sort self.list.at(a), self.list.at(b)
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
      @_reverseSort = sortColumn.reverse || false
      
    @_sortColumn = sortColumn
    
    @refreshHeader()
    @sort()
  
  @method 'sort', ->
    self = this
    @_mapping.sort @sortFunction()
    if @_loaded
      tbody = $('tbody', @_tableElement)
      for index in @_mapping
        tbody.append $('tr.item' + index)

  @method 'positionRow', (item) ->
    # inPlace = false
    # sortFunction = @getSortFunction()
    # startIndex = @rows.indexOf row
    # index = startIndex
    # oldTop = row.offset().top
    # 
    # until inPlace
    #   if index > 0 && sortFunction(row, @rows[index - 1]) < 0
    #     @rows[index] = @rows[index - 1]
    #     @rows[index - 1] = row
    #     index--
    #   else if index < (this.rows.length - 1) && sortFunction(row, this.rows[index + 1]) > 0
    #     @rows[index] = @rows[index + 1]
    #     @rows[index + 1] = row
    #     index++
    #   else
    #     inPlace = true
    #     
    # return if index == startIndex
    # 
    # if index > 0
    #   @rows[index - 1].after row
    # else
    #   @tbodyElement.prepend row
    
  @method 'render', (element) ->
    @super element
    @renderTable()
    element.append @_tableElement
  
  @method 'renderTable', ->
    @_tableElement = @helper().tag('table').addClass('tableView')
    @_tableElement.addClass @_tableClass if @_tableClass
    html = []
    @generateHeaderHTML html
    @generateBodyHTML html
    @_tableElement.html html.join('')
    @activateHeader $('thead', @_tableElement)
  
  @method 'generateHeaderHTML', (html, media='screen') ->
    html.push '<thead>'
    @generateHeaderInnerHTML html, media
    html.push '</thead>'
  
  @method 'generateHeaderInnerHTML', (html, media='screen') ->
    html.push '<tr>'
    
    for column in @_columns
      unless column.hidden or (column.media and column.media != media)
        @generateColumnHeaderHTML column, html, media
      
    if @_canCustomizeColumns
      html.push '<th class="actions"><a class="columnsButton" onmouseover="$(this).addClass(\'columnsButtonHover\')" onmouseout="$(this).removeClass(\'columnsButtonHover\')" href="javascript:;">C</a></th>'
    
    html.push '</tr>'
  
  @method 'activateHeader', (element) ->
    if @_canCustomizeColumns
      $('.actions', element).popup @method('generateColumnsPopup')
  
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
  
  @method 'generateBodyHTML', (html, media='screen') ->
    html.push '<tbody>'
    @generateBodyInnerHTML html, media
    html.push '</tbody>'
  
  @method 'generateBodyInnerHTML', (html, media='screen') ->
    self = this
    @_list.each (item) ->
      self.generateRowHTML item, html, media
  
  @method 'generateRowHTML', (item, html, media='screen') ->
    html.push '<tr class="item'
    html.push @_list.indexOf(item)
    html.push '">'
    @generateRowInnerHTML item, html, media
    html.push '</tr>'

  @method 'generateRowInnerHTML', (item, html, media='screen') ->
    for column in @_columns      
      unless column.hidden or (column.media and column.media != media)
        @generateCellHTML item, column, html, media
  
  @method 'generateCellHTML', (item, column, html, media='screen') ->
    if column == @_columns[@_columns.length - 1]
      html.push '<td colspan="2">'
    else
      html.push '<td>'
    @generateCellInnerHTML item, column, html, media
    html.push '</td>'
  
  @method 'generateCellInnerHTML', (item, column, html, media='screen') ->
    html.push(
      if column.html
        column.html item
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
        ST.Object.prototype.get.call item, column.field
  
  @method 'refreshHeader', ->
    if @_loaded
      thead = $ 'thead', @_tableElement
      html = []
      @generateHeaderInnerHTML html
      thead.html html.join('')
      @activateHeader thead

  @method 'refreshBody', ->
    if @_loaded
      tbody = $ 'tbody', @_tableElement
      html = []
      @generateBodyInnerHTML html
      tbody.html html.join('')
  
  @method 'refreshRow', (item) ->
    if @_loaded
      index = @_list.indexOf item
      row = $('tr.item' + index, @_tableElement)
      if row.length
        html = []
        @generateRowInnerHTML item, html
        row.html html.join('')

  @method 'setColumnHidden', (column, hidden) ->
    column.hidden = hidden
    @refreshHeader()
    @refreshBody()
  
  @method 'toggleColumn', (column) ->
    @setColumnHidden column, !column.hidden

  @method 'hideColumn', (column) ->
    @setColumnHidden column, true
  
  @method 'showColumn', (column) ->
    @setColumnHidden column, false
      
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
  
  @method 'listItemAdded', (list, item) ->
    return unless @_loaded
    
    # Assign UID to non-STObjects
    item._uid ||= ST.Object.UID++
    
    index = @_list.indexOf item
    
    insertAt = 0
    sortFn = @getSortFunction()
    tbody = $ 'tbody', @_tableElement
    rows = $ 'tr', tbody
    while insertBefore < rows.length && sortFn(item, @_list.at(@_mapping[insertBefore])) >= 0
      insertBefore++
    
    html = []
    @generateRowHTML item, html
    html = html.join('')
    
    if rows[insertBefore]
      $(rows[insertBefore]).before html
      @_mapping.splice insertBefore, 0, index
    else
      tbody.append html
      @_mapping.push index
  
  @method 'listItemRemoved', (list, item) ->
    if @_loaded
      index = @_list.indexOf Item
      $('tr.item' + index, @_tableElement).remove()
      for i, itemIndex in @_mapping
        @_mapping.splice i, 1 if itemIndex == index
  
  @method 'listItemChanged', (list, item) ->
    if @_loaded
      index = @_list.indexOf Item
      row = $('tr.item' + index, @_tableElement)
      if row.length
        @positionRow item
        @refreshRow item

  @method 'print', (sortColumn) ->
    html = ['<table class="tableView">']
    @generateHeaderHTML html, 'print'
    @generateBodyHTML html, 'print'
    html.push '</table>'
    @helper().print html.join('')