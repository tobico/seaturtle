ST.class 'TableView', 'View', ->
  @GroupingEnabled = false
  
  @constructor 'withCollection', (collection) ->
    @init()
    @columns = []
    @rows = []
    @setCollection collection
    @sortColumn = null
    @reverseSort = false
    @mainElement = null
    @tableElement = null
    @tbodyElement = null
    @actionsDisplay = null
    @showActions = true
    @groupBy = null
    @groups = {}
    @filter = null
    @ignoreChanges = {}
    
  @destructor ->
    @releaseMembers 'collection'
    @_super()
  
  @property 'columns'
  @property 'collection', 'retain'
  @property 'sortColumn'
  @property 'reverseSort'
  @property 'actionsDisplay'
  @property 'tableClass'
  @property 'mainElement', null, 'readonly'
  @property 'tableElement', null, 'readonly'
  @property 'tbodyElement', null, 'readonly'
  @property 'filter'
  @property 'showActions'
  
  @method 'setCollection', (newCollection) ->
    return if newCollection == @collection
    
    if @collection
      @collection.unbindAll this
      @collection.release()
    
    @collection = newCollection
    
    if @collection
      @collection.retain()
      @collection.bind 'itemAdded', this, 'collectionItemAdded'
      @collection.bind 'itemChanged', this, 'collectionItemChanged'
      @collection.bind 'itemRemoved', this, 'collectionItemRemoved'

  @method 'setColumns', (columns, sortColumnIndex=0) ->
    @columns = columns
    @setSortColumn @columns[sortColumnIndex] if @sortColumn == false && @columns.length
    @refreshHeaders() if @loaded
    
  @method 'addColumn', (column) ->
    @columns.push column
    @refreshHeaders() if @loaded
  
  @method 'getSortFunction', (sortColumn) ->
    self = this
    column = sortColumn || @sortColumn
    
    if column.sort
      if @reverseSort
        (a, b) -> column.sort(b.item, a.item)
      else
        (a, b) -> column.sort(a.item, b.item)
    else
      ST.makeSortFn (row) ->
        self.getCellValue column, row.item
      , @reverseSort

  @method 'setSortColumn', (sortColumn, reverseSort) ->
    self = this
    oldSortColumn = @sortColumn
    
    @reverseSort = reverseSort if reverseSort isnt undefined
      
    if oldSortColumn == sortColumn
      @reverseSort = !@reverseSort
    else
      @reverseSort = sortColumn.reverse || false
      
    @sortColumn = sortColumn
      
    @sort()
    
    if @groupBy
      @groupBy = sortColumn
      @renderMain()
    else
      @refreshColumnHeader oldSortColumn
      @refreshColumnHeader sortColumn
  
  @method 'sort', ->
    self = this
    @rows.sort @getSortFunction()
    if @loaded
      if @groupBy
      else
        @rows.each (row) -> self.tbodyElement.append row

  @method 'sortRow', (row) ->
    inPlace = false
    sortFunction = @getSortFunction()
    startIndex = @rows.indexOf row
    index = startIndex
    oldTop = row.offset().top
    
    until inPlace
      if index > 0 && sortFunction(row, @rows[index - 1]) < 0
        @rows[index] = @rows[index - 1]
        @rows[index - 1] = row
        index--
      else if index < (this.rows.length - 1) && sortFunction(row, this.rows[index + 1]) > 0
        @rows[index] = @rows[index + 1]
        @rows[index + 1] = row
        index++
      else
        inPlace = true
        
    return if index == startIndex
    
    if index > 0
      @rows[index - 1].after row
    else
      @tbodyElement.prepend row
    
  @method 'setSort', (id, reverse) ->
    column = @columns[id];
    @setSortColumn column, reverse
  
  @method 'setFilter', (newFilter) ->
    return if newFilter == @filter
    @filter = newFilter
    @refilter()
  
  @method 'refilter', ->
    return unless @loaded
    
    if @filter
      for row in rows
        if @filter row.item
          row.css 'display', 'table-row'
        else
          row.hide()
    else
      for row in rows
        row.css 'display', 'table-row'
  
  @method 'reload', ->
    @error 'STTableView reloaded'
  
  @method 'render', (element) ->
    @_super element
    @mainElement = $('<div></div>').appendTo(element)
    @renderMain()
  
  @method 'renderMain', ->
    self = this
  
    @loadRows()
    for row in rows
      row.detach()
    
    @mainElement.empty()
      
    if @groupBy
      @getGroupValues().each (value) ->
        group = {};
        self.groups[value] = group
        self.renderTable group
        self.mainElement.append '<h3>' + value + '</h3>'
        self.mainElement.append group.tableElement
      for row in rows
        value = self.getCellValue self.groupBy, row.item
        self.groups[value].tbodyElement.append row
    else
      this.renderTable this
      self.mainElement.append this.tableElement
      for row in rows
        @tbodyElement.append row
    
    @refresh()
  
  @method 'renderTable', (object) ->
    object.tableElement = @helper.tag('table').addClass('tableView')
    object.tableElement.addClass @tableClass if @tableClass
    object.tbodyElement = @helper.tag('tbody').appendTo object.tableElement
    object.tableElement.prepend @helper.tag('thead').append(@renderHeader())
  
  @method 'renderHeader', ->
    header = @helper.tag('tr')
    for column in @columns
      unless column.hidden or column.printOnly
        header.append @renderHeaderForColumn(column)
      
    if @showActions
      th = @helper.tag 'th'
      th.addClass 'actions'
      th.appendTo header
      a = @helper.tag 'a'
      a.appendTo th
      a.addClass 'columnsButton'
      a.hover -> $(this).addClass 'columnsButtonHover'
      , -> $(this).removeClass 'columnsButtonHover'
      a.popup @methodFn('generateColumnsPopup')
      
    header
  
  @method 'renderRow', (row) ->
    row.empty()
    skip = 0
    for column in columns      
      unless column.hidden || column.printOnly
        if skip > 0
          skip--
          continue
        
        cell = @helper.tag 'td'
        row.append cell
        skip += @renderCell cell, column, row
    if @showActions
      actionsCell = @helper.tag 'td'
      actionsCell.appendTo row
      @actionsDisplay actionsCell, row.item if @actionsDisplay
      
  @method 'renderCell', (cell, column, row) ->
    skip = 0
    value = @getCellValue column, row.item
    if column.display
      column.display cell, row.item, value, row
      colSpan = cell.attr 'colspan'
      skip += colSpan - 1 if colSpan > 1
    else
      cell.append value
    skip
  
  @method 'getCellValue', (column, item) ->
    value = false
    
    if column.value
      value = column.value item
    else if column.field
      if item && item.get
        value = item.get column.field
      else if item
        value = ST.Object.prototype.get.call item, column.field
    
    if column.filter
      value = column.filter value
    if column.filters
      for filter in column.filters
        value = filter(value)
    
    return value;
  
  @method 'getGroupValues', ->
    values = []
    for row in @rows
      value = @getCellValue @groupBy, row
      values.push value unless values.indexOf(value) >= 0
    values
    
  @method 'loadRows', ->
    unless @rows.length
      self = this
      @collection.each (item) ->
        self.rows.push self.makeRow(item)
      @sort()
  
  @method 'unloadRows', ->
    if @rows.length
      for row in @rows
        row.remove()
        row.empty()
      @itemRows = {}
  
  @method 'makeRow', (item) ->
    row = @helper.tag 'tr'
    row.item = item
    @itemRows[item._uid] = row
    row.hide() if @filter && !@filter(row.item)
    row
  
  @method 'removeRow', (item) ->
    if @itemRows[item._uid]
      row = @itemRows[item._uid]
      delete @itemRows[item._uid]
      @rows.remove row
      row.item = null
      row.remove()
  
  @method 'refresh', ->
    for row in @rows
      @renderRow row
  
  @method 'refreshHeaders', ->
    self = this
    $('thead', @element).each ->
      $(this).empty().append self.renderHeader()
  
  @method 'refreshItem', (item) ->
    if @itemRows[item._uid]
      @renderRow @itemRows[item._uid]
   
  @method 'renderHeaderForColumn', (column) ->
    self = this
    
    cell = @helper.tag('th').css('cursor', 'pointer').click ->
      self.setSortColumn column
    column.header = cell
    
    self.refreshColumnHeadercolumn
    
    cell
  
  @method 'refreshColumnHeader', (column) ->
    if column.header
      column.header.html column.title
    
      if column == @sortColumn
        span = @helper.tag 'span'
        if @reverseSort
          span.html ' &#x2191;' 
        else
          span.html ' &#x2193;'
        span.addClass 'sortLabel'
        span.appendTo column.header
  
  @method 'setColumnHidden', (column, hidden) ->
    column.hidden = hidden
    @refresh()
    @renderMain()
  
  @method 'toggleColumn', (column) ->
    @setColumnHidden column, !column.hidden

  @method 'hideColumn', (column) ->
    @setColumnHidden column, true
  
  @method 'showColumn', (column) ->
    @setColumnHidden column, false
      
  @method 'generateColumnsPopup', ->
    self = this
    a = []
    for column in columns
      unless column.printOnly
        data = {
          title:  column.fullTitle || column.title
          action: ((column) -> -> self.toggleColumn column)(column)
        }
        data.title = '&#x2714; ' + data.title unless column.hidden
    if ST.TableView.GroupingEnabled
      a.push '-'
      data = {
        title:  'grouped'
        action: ->
          if self.groupBy
            self.groupBy = null
          else
            self.groupBy = self.getSortColumn()
          self.renderMain()
      }
      data.title = '&#x2714; ' + data.title if @groupBy
    a
  
  @method 'collectionItemAdded', (array, item) ->
    return unless @loaded
    
    # Assign UID to non-STObjects
    item._uid ||= ST.Object.UID++
    
    # Check that item doesn't already have a row
    return if @itemRows[item._uid] isnt undefined
    
    row = @makeRow item
    if @groupBy
      #TODO: Something
    else if @tbodyElement
      index = 0
      sortFn = @getSortFunction()
      while index < @rows.length && sortFn(row, @rows[index]) >= 0
        index++
      
      if index < @rows.length - 1
        @rows.insert index + 1, row
        @rows[index].after row
      else
        @rows.push row
        @tbodyElement.append row
    @renderRow row
  
  @method 'collectionItemRemoved', (array, item) ->
    @removeRow item if @loaded
  
  @method 'collectionItemChanged', (array, item) ->
    if @itemRows[item._uid]
      @sortRow @itemRows[item._uid]
      if @ignoreChanges[item._uid]
        @ignoreChanges[item._uid]--
      else
        @renderRow @itemRows[item._uid]

  @method 'ignoreChange', (item, number) ->
    @ignoreChanges[item._uid] = (this.ignoreChanges[item._uid] || 0) + (number || 1)
  
  @method 'getPrintVersion', (sortColumn) ->
    self = this
    
    html = '<table class="tableView"><thead><tr>'
    for column in @columns
      unless column.hidden || column.displayOnly
        html += '<th>' + column.title + '</th>'
    
    printRows = []
    @collection.each (item) ->
      printRows.push {item: item}
    printRows.sort this.getSortFunction(sortColumn || this.sortColumn)
    for row in printRows
      html += '<tr>'
      for column in columns
        unless column.hidden || column.displayOnly        
          value = @getCellValue column, row.item
          value = column.print row.item, value if column.print
          value ||= '&nbsp;'
          html += '<td>' + value + '</td>'
      html += '</tr>'
    
    html += '</tr></thead><tbody>'
    html += '</tbody></table>'
    html