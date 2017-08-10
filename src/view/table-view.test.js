import jQuery from 'jquery'

import { BaseObject } from '../core/base-object'
import { TableView } from './table-view'
import { List } from '../core/list'

describe('TableView', function() {
  let list, tableView

  beforeEach(function() {
    list = List.create()
    list.add({name: 'Zack',  age: 17})
    list.add({name: 'Eliza', age: 28})
    list.add({name: 'Steve', age: 22})
    tableView = TableView.createWithList(list)
    tableView.columns([{
      field: 'name',
      title: 'Name'
    }, {
      field: 'age',
      title: 'Age'
    }])})
  
  describe('#initWithList', function() {
    beforeEach(function() {
      list = List.create()
      tableView = new TableView
      tableView.initWithList(list)
    })
    
    it("should set defaults", function() {
      expect(tableView.columns()).toEqual([])
      expect(tableView._ordered).toEqual([])
      expect(tableView.sortColumn()).toBe(null)
      expect(tableView.reverseSort()).toBe(false)
      expect(tableView.tableClass()).toBe(null)
      expect(tableView.tableElement()).toBe(null)
      expect(tableView.canCustomizeColumns()).toBe(true)
    })
    
    it("should set list", function() {
      expect(tableView._list).toBe(list)
    })
  })
  
  describe('#setList', function() {
    it("should set list", function() {
      const list = List.create()
      tableView.list(list)
      expect(tableView._list).toBe(list)
    })
    
    it("should unbind old list", function() {
      const unbindAll = jest.spyOn(list, 'unbindAll')
      tableView.list(null)
      expect(unbindAll).toBeCalledWith(tableView)
    })
    
    it("should bind new list", function() {
      const list = List.create()
      const bind = jest.spyOn(list, 'bind')
      tableView.list(list)
      expect(bind.mock.calls.length).toEqual(3)
    })
  })
  
  describe('#setColumns', function() {
    let columns

    beforeEach(function() {
      columns = [{}, {}]
      tableView.columns(columns)
    })
  
    it("should set column indexes", function() {
      expect(columns[0].index).toEqual(0)
      expect(columns[1].index).toEqual(1)
    })
    
    it("should set default sort column", function() {
      expect(tableView.sortColumn()).toBe(columns[0])
    })
    
    it("should refresh header and body when loaded", function() {
      tableView.load()
      tableView.refreshHeader = jest.fn()
      tableView.refreshBody = jest.fn()
      tableView.columns(columns)
      expect(tableView.refreshHeader).toBeCalled()
      expect(tableView.refreshBody).toBeCalled()
    })
    
    it("should not refresh header or body when not loaded", function() {
      tableView.refreshHeader = jest.fn()
      tableView.refreshBody = jest.fn()
      tableView.columns(columns)
      expect(tableView.refreshHeader).not.toBeCalled()
      expect(tableView.refreshBody).not.toBeCalled()
    })
  })
  
  describe('#sortFunction', function() {
    describe('with a custom sort function', function() {
      let sortFn

      beforeEach(function() {
        sortFn = (a, b) => 0
        tableView.columns([{
          sort: sortFn
        }])})
      
      it("should the custom sort function", function() {
        expect(tableView.sortFunction()).toBe(sortFn)
      })
    })
    
    it("should sort with default sort function in ascending order", function() {
      list._array.sort(tableView.sortFunction())
      expect(list.first().name).toEqual('Eliza')
    })
    
    it("should sort with default sort function in descending order")
  })
  
  describe('#setSortColumn', function() {
    it("should accept an index", function() {
      tableView.sortColumn(1)
      expect(tableView.sortColumn()).toBe(tableView.columns()[1])
    })
    
    it("should set sort column", function() {
      const column = tableView.columns()[0]
      tableView.sortColumn(column)
      expect(tableView.sortColumn()).toBe(column)
    })
    
    it("should toggle _reverseSort when set to same value", function() {
      tableView.sortColumn(0)
      expect(tableView.reverseSort()).toBe(true)
    })
    
    it("should set _reverseSort to false when set to different value", function() {
      tableView.sortColumn(1)
      expect(tableView.reverseSort()).toBe(false)
    })
    
    it("should resort items", function() {
      tableView.sort = jest.fn()
      tableView.sortColumn(0)
      expect(tableView.sort).toBeCalled()
    })
    
    it("should refresh header if loaded", function() {
      tableView.load()
      tableView.refreshHeader = jest.fn()
      tableView.sortColumn(0)
      expect(tableView.refreshHeader).toBeCalled()
    })
  })
  
  describe('#sort', () =>
    it("should rearrage table rows", function() {
      tableView.load()
      tableView.sort()
      const rows = jQuery('tr td:first-child', tableView.element())
      expect(rows[0].innerHTML).toEqual('Eliza')
      expect(rows[1].innerHTML).toEqual('Steve')
      expect(rows[2].innerHTML).toEqual('Zack')
    })
  )
  
  describe('#render', function() {
    it("should render table", function() {
      tableView.renderTable = jest.fn()
      tableView.render()
      expect(tableView.renderTable).toBeCalled()
    })
    
    it("should append tableElement to element", function() {
      tableView.render()
      expect(jQuery('table', tableView.element()).length).toEqual(1)
    })
    
    it("should render columns button", function() {
      tableView.renderColumnsButton = jest.fn()
      tableView.render()
      expect(tableView.renderColumnsButton).toBeCalled()
    })
  })
  
  describe('#renderTable', function() {
    it("should create _tableElement", function() {
      tableView.renderTable()
      expect(tableView.tableElement()).toBeInstanceOf(jQuery)
    })
    
    it("should set table CSS class", function() {
      tableView.tableClass('banana')
      tableView.renderTable()
      expect(tableView.tableElement().is('.banana')).toBe(true)
    })
    
    it("should activate body", function() {
      tableView.activateBody = jest.fn()
      tableView.renderTable()
      expect(tableView.activateBody).toBeCalled()
    })
  })
  
  describe("#renderColumnsButton", () =>
    it("should append a columns button", function() {
      tableView.renderColumnsButton()
      expect(jQuery('.columnsButton', tableView.element()).length).toEqual(1)
    }) 
  )
  
  describe('#generateHeaderInnerHTML', function() {
    it("should be wrapped in a TR tag", function() {
      const html = []
      tableView.generateHeaderInnerHTML(html)
      expect(html.indexOf('<tr>')).toEqual(0)
      expect(html.indexOf('</tr>')).toEqual(html.length - 1)
    })
    
    it("should generate HTML for each column header", function() {
      const html = []
      tableView.generateHeaderInnerHTML(html)
      expect(html.indexOf('Name')).not.toEqual(-1)
      expect(html.indexOf('Age')).not.toEqual(-1)
    })
    
    it("should not include hidden column", function() {
      tableView.toggleColumn(tableView.columns()[1])
      const html = []
      tableView.generateHeaderInnerHTML(html)
      expect(html.indexOf('Age')).toEqual(-1)
    })
      
    it("should not include column with wrong media type", function() {
      tableView.columns()[1].media = 'print'
      const html = []
      tableView.generateHeaderInnerHTML(html)
      expect(html.indexOf('Age')).toEqual(-1)
    })
  })
      
  describe('#generateColumnHeaderHTML', function() {
    it("should generate TH html", function() {
      let html = []
      tableView.generateColumnHeaderHTML(tableView.columns()[0], html)
      html = html.join('')
      expect(html.indexOf('<th')).toEqual(0)
      expect(html.indexOf('</th>')).not.toEqual(-1)
    })
    
    it("should include column title", function() {
      const html = []
      tableView.generateColumnHeaderHTML(tableView.columns()[0], html)
      expect(html.indexOf('Name')).not.toEqual(-1)
    })
    
    it("should display ascending sort marker", function() {
      const html = []
      tableView.generateColumnHeaderHTML(tableView.columns()[0], html)
      expect(html.indexOf(' &#x2193;')).not.toEqual(-1)
    })
    
    it("should display descending sort marker", function() {
      const html = []
      tableView.sortColumn(0)
      tableView.generateColumnHeaderHTML(tableView.columns()[0], html)
      expect(html.indexOf(' &#x2191;')).not.toEqual(-1)
    })
  })
  
  describe('#generateBodyInnerHTML', () =>
    it("should generate HTML for each row", function() {
      const generateRowHTML = jest.spyOn(tableView, 'generateRowHTML')
      const html = []
      tableView.generateBodyInnerHTML(html)
      expect(generateRowHTML.mock.calls.length).toEqual(3)
    })
  )
  
  describe("#activateBody", () => it("should activate each row"))
  
  describe('#generateRowHTML', () =>
    it("should wrap row innerHTML in a <tr> tag", function() {
      const html = []
      const generateRowInnerHTML = jest.spyOn(tableView, 'generateRowInnerHTML')
      tableView.generateRowHTML(tableView.list().at(0), html)
      expect(html[0]).toEqual('<tr data-uid="')
      expect(html[html.length-1]).toEqual('</tr>')
      expect(generateRowInnerHTML).toBeCalled()
    })
  )
    
  describe('#cellValue', function() {
    it("should call custom value generator", function() {
      const item = tableView.list().at(0)
      const column = tableView.columns()[0]
      column.value = jest.fn()
      tableView.cellValue(item, column)
      expect(column.value).toBeCalled()
    })
    
    it("should get value for field of BaseObject", function() {
      const item = BaseObject.create()
      item.foo = () => 'bacon'
      const column = {field: 'foo'}
      expect(tableView.cellValue(item, column)).toEqual('bacon')
    })
    
    it("should get value for field of non-BaseObject", function() {
      const item = {foo: 'bacon'}
      const column = {field: 'foo'}
      expect(tableView.cellValue(item, column)).toEqual('bacon')
    })
  })
  
  describe('#refreshHeader', () =>
    it("should regenerate header innerHTML", function() {
      tableView.load()
      const generateHeaderInnerHTML = jest.spyOn(tableView, 'generateHeaderInnerHTML')
      tableView.refreshHeader()
      expect(generateHeaderInnerHTML).toBeCalled()
    })
  )
  
  describe('#refreshBody', () =>
    it("should regenerate body innerHTML", function() {
      tableView.load()
      const generateBodyInnerHTML = jest.spyOn(tableView, 'generateBodyInnerHTML')
      tableView.refreshBody()
      expect(generateBodyInnerHTML).toBeCalled()
    })
  )
  
  describe('#refreshRow', function() {
    it("should regenerate row innerHTML", function() {
      tableView.load()
      const item = tableView.list().at(0)
      const generateRowInnerHTML = jest.spyOn(tableView, 'generateRowInnerHTML')
      tableView.refreshRow(item)
      expect(generateRowInnerHTML).toBeCalled()
    })
    
    it("should reactivate row", function() {
      tableView.load()
      const item = tableView.list().at(0)
      const activateRow = jest.spyOn(tableView, 'activateRow')
      tableView.refreshRow(item)
      expect(activateRow).toBeCalledWith(item)
    })
  })
  
  describe('#toggleColumn', function() {
    it("should make visible column hidden", function() {
      const column = tableView.columns()[0]
      tableView.toggleColumn(column)
      expect(column.hidden).toBe(true)
    })
    
    it("should make hidden column visible", function() {
      const column = tableView.columns()[0]
      column.hidden = true
      tableView.toggleColumn(column)
      expect(column.hidden).toBe(false)
    })

    it("should refresh header", function() {
      const column = tableView.columns()[0]
      const refreshHeader = jest.spyOn(tableView, 'refreshHeader')
      tableView.toggleColumn(column)
      expect(refreshHeader).toBeCalled()
    })
    
    it("should refresh body", function() {
      const column = tableView.columns()[0]
      const refreshBody = jest.spyOn(tableView, 'refreshBody')
      tableView.toggleColumn(column)
      expect(refreshBody).toBeCalled()
    })
  })
  
  describe('#generateColumnsPopup', function() {
    it("should include popup item for a column", function() {
      const a = tableView.generateColumnsPopup()
      expect(a.length).toEqual(2)
    })
    
    it("should not include column with non-screen media type", function() {
      tableView.columns()[0].media = 'print'
      const a = tableView.generateColumnsPopup()
      expect(a.length).toEqual(1)
    })
    
    it("should assign action to toggle column visibility", function() {
      const a = tableView.generateColumnsPopup()
      expect(a[0].action).toBeInstanceOf(Function)
    })
  })
  
  describe('#listItemAdded', function() {
    beforeEach(function() {
      tableView.load()
      list.add({name: 'Fred', age: 19})})
          
    it("should generate row for new item", function() {
      expect(jQuery('tr', tableView.element()).length).toEqual(5)
    })
    
    it("should sort items", function() {
      const sort = jest.spyOn(tableView, 'sort')
      list.add({name: 'Jane', age: 44})
      expect(sort).toBeCalled()
  })
})
  
  describe('#listItemRemoved', function() {
    beforeEach(function() {
      tableView.load()
    })
  
    it("should remove row for item", function() {
      list.removeAt(0)
      expect(jQuery('tbody tr', tableView.element()).length).toEqual(2)
    })
  })
  
  describe('#listItemChanged', function() {
    let item

    beforeEach(function() {
      item = BaseObject.create()
      list.add(item)
      tableView.load()
    })
    
    it("should refresh row", function() {
      const refreshRow = jest.spyOn(tableView, 'refreshRow')
      item.trigger('changed')
      expect(refreshRow).toBeCalledWith(item)
    })
    
    it("should sort items", function() {
      const sort = jest.spyOn(tableView, 'sort')
      item.trigger('changed')
      expect(sort).toBeCalled()
    })
  })
  
  describe('#print', function() {
    beforeEach(function() {
      tableView.helper().print = function() {}
    })
    
    it("should generate table HTML", function() {
      const generateTableHTML = jest.spyOn(tableView, 'generateTableHTML')
      tableView.print()
      expect(generateTableHTML).toBeCalled()
    })
    
    it("should print", function() {
      const print = jest.spyOn(tableView.helper(), 'print')
      tableView.print()
      expect(print).toBeCalled()
    })
  })
})
