#require ST/TableView

$ ->
  Spec.describe 'TableView', ->
    beforeEach ->
      @list = ST.List.create()
      @list.add {name: 'Zack',  age: 17}
      @list.add {name: 'Eliza', age: 28}
      @list.add {name: 'Steve', age: 22}
      @tableView = ST.TableView.createWithList @list
      @tableView.columns [
        {field: 'name', title: 'Name'},
        {field: 'age',  title: 'Age'}
      ]
    
    describe '#initWithList', ->
      beforeEach ->
        @list = ST.List.create()
        @tableView = new ST.TableView
        @tableView.initWithList @list
      
      it "should add instance to ST.TableView.Instances", ->
        id = @tableView._id
        id.should beAnInstanceOf(Number)
        ST.TableView.Instances[id].should be(@tableView)
      
      it "should set defaults", ->
        @tableView.columns().should equal([])
        @tableView._mapping.should equal([])
        expect(@tableView.sortColumn()).to be(null)
        @tableView.reverseSort().should beFalse
        expect(@tableView.tableClass()).to be(null)
        expect(@tableView.tableElement()).to be(null)
        @tableView.canCustomizeColumns().should beTrue
      
      it "should set list", ->
        @tableView._list.should be(@list)
    
    describe '#destroy', ->
      it "should remove instance from ST.TableView.Instances", ->
        id = @tableView._id
        @tableView.release()
        expect(ST.TableView.Instances[id]).to be(null)
    
    describe '#setList', ->
      it "should set list", ->
        list = ST.List.create()
        @tableView.list list
        @tableView._list.should be(list)
      
      it "should unbind old list", ->
        @list.shouldReceive('unbindAll').with(@tableView)
        @tableView.list null
      
      it "should bind new list", ->
        list = ST.List.create()
        list.shouldReceive('bind').exactly(3).times
        @tableView.list list
      
      it "should create mapping", ->
        list = ST.List.create()
        @tableView.shouldReceive 'createMapping'
        @tableView.list list
    
    describe "#createMapping", ->
      it "should rebuild mapping", ->
        list = ST.List.create()
        list.add 'fish'
        list.add 'apples'
        @tableView.list list
        @tableView._mapping.should equal([0, 1])
    
    describe '#setColumns', ->
      beforeEach ->
        @columns = [{}, {}]
        @tableView.columns @columns
    
      it "should set column indexes", ->
        @columns[0].index.should equal(0)
        @columns[1].index.should equal(1)
      
      it "should set default sort column", ->
        @tableView.sortColumn().should be(@columns[0])
      
      it "should refresh header and body when loaded", ->
        @tableView.load()
        @tableView.shouldReceive 'refreshHeader'
        @tableView.shouldReceive 'refreshBody'
        @tableView.columns @columns
      
      it "should not refresh header or body when not loaded", ->
        @tableView.shouldNotReceive 'refreshHeader'
        @tableView.shouldNotReceive 'refreshBody'
        @tableView.columns @columns
    
    describe '#sortFunction', ->
      context 'with a custom sort function', ->
        beforeEach ->
          @tableView.columns [{
            sort: (a, b) ->
              if a.age > b.age
                1
              else if a.age < b.age
                -1
              else
                0
          }]
          
        it "should sort in ascending order", ->
          fn = @tableView.sortFunction()
          [0,1,2].sort(fn).should equal([0,2,1])

        it "should sort in descending order", ->
          @tableView.reverseSort true
          fn = @tableView.sortFunction()
          [0,1,2].sort(fn).should equal([1,2,0])
      
      it "should sort with default sort function in ascending order", ->
        fn = @tableView.sortFunction()
        [0,1,2].sort(fn).should equal([1,2,0])
        
      it "should sort with default sort function in descending order"
    
    describe '#setSortColumn', ->
      it "should accept an index", ->
        @tableView.sortColumn 1
        @tableView.sortColumn().should be(@tableView.columns()[1])
      
      it "should set sort column", ->
        column = @tableView.columns()[0]
        @tableView.sortColumn column
        @tableView.sortColumn().should be(column)
      
      it "should toggle _reverseSort when set to same value", ->
        @tableView.sortColumn 0
        @tableView.reverseSort().should beTrue
      
      it "should set _reverseSort to false when set to different value", ->
        @tableView.sortColumn 1
        @tableView.reverseSort().should beFalse
      
      it "should resort items", ->
        @tableView.shouldReceive 'sort'
        @tableView.sortColumn 0
      
      it "should refresh header if loaded", ->
        @tableView.load()
        @tableView.shouldReceive 'refreshHeader'
        @tableView.sortColumn 0
    
    describe '#sort', ->
      it "should sort _mapping", ->
        @tableView._mapping = [0,1,2]
        @tableView.sort()
        @tableView._mapping.should equal([1,2,0])
      
      it "should rearrage table rows", ->
        @tableView.load()
        @tableView.sort()
        rows = $ 'tr', @tableView.element()
        rows[1].className.should equal('item1')
        rows[2].className.should equal('item2')
        rows[3].className.should equal('item0')
    
    describe '#render', ->
      it "should render table", ->
        @tableView.shouldReceive 'renderTable'
        @tableView.render()
      
      it "should append tableElement to element", ->
        @tableView.render()
        $('table', @tableView.element()).length.should equal(1)
      
      it "should render columns button", ->
        @tableView.shouldReceive 'renderColumnsButton'
        @tableView.render()
    
    describe '#renderTable', ->
      it "should create _tableElement", ->
        @tableView.renderTable()
        @tableView.tableElement().should beAnInstanceOf(jQuery)
      
      it "should set table CSS class", ->
        @tableView.tableClass 'banana'
        @tableView.renderTable()
        @tableView.tableElement().is('.banana').should beTrue
      
      it "should load table element HTML", ->
        @tableView.shouldReceive 'generateHeaderHTML'
        @tableView.shouldReceive 'generateBodyHTML'
        @tableView.renderTable()
      
      it "should activate body", ->
        @tableView.shouldReceive 'activateBody'
        @tableView.renderTable()
    
    describe "#renderColumnsButton", ->
      it "should append a columns button", ->
        @tableView.renderColumnsButton()
        $('.columnsButton', @tableView.element()).length.should equal(1)
    
    describe '#generateHeaderHTML', ->
      it "should wrap header innerHTML in THEAD tag", ->
        html = []
        @tableView.shouldReceive 'generateHeaderInnerHTML'
        @tableView.generateHeaderHTML html
        html.indexOf('<thead>').should equal(0)
        html.indexOf('</thead>').should equal(html.length - 1)
    
    describe '#generateHeaderInnerHTML', ->
      it "should be wrapped in a TR tag", ->
        html = []
        @tableView.generateHeaderInnerHTML html
        html.indexOf('<tr>').should equal(0)
        html.indexOf('</tr>').should equal(html.length - 1)
      
      it "should generate HTML for each column header", ->
        html = []
        @tableView.generateHeaderInnerHTML html
        html.indexOf('Name').shouldNot equal(-1)
        html.indexOf('Age').shouldNot equal(-1)
      
      it "should not include hidden column", ->
        @tableView.toggleColumn @tableView.columns()[1]
        html = []
        @tableView.generateHeaderInnerHTML html
        html.indexOf('Age').should equal(-1)
        
      it "should not include column with wrong media type", ->
        @tableView.columns()[1].media = 'print'
        html = []
        @tableView.generateHeaderInnerHTML html
        html.indexOf('Age').should equal(-1)
        
    describe '#generateColumnHeaderHTML', ->
      it "should generate TH html", ->
        html = []
        @tableView.generateColumnHeaderHTML @tableView.columns()[0], html
        html = html.join('')
        html.indexOf('<th').should equal(0)
        html.indexOf('</th>').shouldNot equal(-1)
      
      it "should generate onclick event to sort by column", ->
        html = []
        @tableView.generateColumnHeaderHTML @tableView.columns()[0], html
        html = html.join('')
        html.indexOf('onclick').shouldNot equal(-1)
      
      it "should include column title", ->
        html = []
        @tableView.generateColumnHeaderHTML @tableView.columns()[0], html
        html.indexOf('Name').shouldNot equal(-1)
      
      it "should display ascending sort marker", ->
        html = []
        @tableView.generateColumnHeaderHTML @tableView.columns()[0], html
        html.indexOf(' &#x2193;').shouldNot equal(-1)
      
      it "should display descending sort marker", ->
        html = []
        @tableView.sortColumn 0
        @tableView.generateColumnHeaderHTML @tableView.columns()[0], html
        html.indexOf(' &#x2191;').shouldNot equal(-1)
    
    describe '#generateBodyHTML', ->
      it "should wrap body innerHTML in TBODY tag", ->
        html = []
        @tableView.shouldReceive 'generateBodyInnerHTML'
        @tableView.generateBodyHTML html
        html[0].should equal('<tbody>')
        html[html.length-1].should equal('</tbody>')
    
    describe '#generateBodyInnerHTML', ->
      it "should generate HTML for each row", ->
        @tableView.shouldReceive('generateRowHTML').exactly(3).times
        html = []
        @tableView.generateBodyInnerHTML html
    
    describe "#activateBody", ->
      it "should activate each row"
    
    describe '#generateRowHTML', ->
      it "should wrap row innerHTML in a <tr> tag", ->
        html = []
        @tableView.shouldReceive 'generateRowInnerHTML'
        @tableView.generateRowHTML @tableView.list().at(0), html
        html[0].should equal('<tr class="item')
        html[html.length-1].should equal('</tr>')
      
      it "should include item index as a CSS class", ->
        html = []
        @tableView.generateRowHTML @tableView.list().at(0), html
        html.join('').indexOf('class="item0"').shouldNot equal(-1)
    
    describe '#generateRowInnerHTML', ->
      it "should generate cell HTML", ->
        @tableView.shouldReceive('generateCellHTML').twice()
        @tableView.generateRowInnerHTML @tableView.list().at(0), []
      
      it "should skip cell for hidden column", ->
        @tableView.toggleColumn @tableView.columns()[1]
        @tableView.shouldReceive('generateCellHTML')
        @tableView.generateRowInnerHTML @tableView.list().at(0), []
      
      it "should skip cell for column with wrong media type", ->
        @tableView.columns()[1].media = 'print'
        @tableView.shouldReceive('generateCellHTML')
        @tableView.generateRowInnerHTML @tableView.list().at(0), []
    
    describe '#activateRow', ->
      it "should activate each cell"
    
    describe '#generateCellHTML', ->
      it "should wrap cell innerHTML in a <td> tag", ->
        html = []
        @tableView.shouldReceive 'generateCellInnerHTML'
        @tableView.generateCellHTML @tableView.list().at(0), @tableView.columns()[0], html
        html[0].should equal('<td>')
        html[html.length-1].should equal('</td>')
    
    describe '#generateCellInnerHTML', ->
      it "should call custom column html generator", ->
        item = @tableView.list().at(0)
        column = @tableView.columns()[0]
        column.shouldReceive 'html'
        @tableView.generateCellInnerHTML item, column, []
        
      it "should display cell value if no custom generator", ->
        item = @tableView.list().at(0)
        column = @tableView.columns()[0]
        @tableView.shouldReceive('cellValue').with(item, column, 'screen')
        @tableView.generateCellInnerHTML item, column, []
      
    describe '#cellValue', ->
      it "should call custom value generator", ->
        item = @tableView.list().at(0)
        column = @tableView.columns()[0]
        column.shouldReceive 'value'
        @tableView.cellValue item, column
      
      it "should get value for field of ST.Object", ->
        item = ST.Object.create()
        item.foo = -> 'bacon'
        column = {field: 'foo'}
        @tableView.cellValue(item, column).should equal('bacon')
      
      it "should get value for field of non-ST.Object", ->
        item = {foo: 'bacon'}
        column = {field: 'foo'}
        @tableView.cellValue(item, column).should equal('bacon')
    
    describe '#refreshHeader', ->
      it "should regenerate header innerHTML", ->
        @tableView.load()
        @tableView.shouldReceive 'generateHeaderInnerHTML'
        @tableView.refreshHeader()
    
    describe '#refreshBody', ->
      it "should regenerate body innerHTML", ->
        @tableView.load()
        @tableView.shouldReceive 'generateBodyInnerHTML'
        @tableView.refreshBody()
    
    describe '#refreshRow', ->
      it "should regenerate row innerHTML", ->
        @tableView.load()
        item = @tableView.list().at(0)
        @tableView.shouldReceive 'generateRowInnerHTML'
        @tableView.refreshRow item
      
      it "should reactivate row", ->
        @tableView.load()
        item = @tableView.list().at(0)
        @tableView.shouldReceive('activateRow').with(item)
        @tableView.refreshRow item
    
    describe '#toggleColumn', ->
      it "should make visible column hidden", ->
        column = @tableView.columns()[0]
        @tableView.toggleColumn column
        column.hidden.should beTrue
      
      it "should make hidden column visible", ->
        column = @tableView.columns()[0]
        column.hidden = true
        @tableView.toggleColumn column
        column.hidden.should beFalse

      it "should refresh header", ->
        column = @tableView.columns()[0]
        @tableView.shouldReceive 'refreshHeader'
        @tableView.toggleColumn column
      
      it "should refresh body", ->
        column = @tableView.columns()[0]
        @tableView.shouldReceive 'refreshBody'
        @tableView.toggleColumn column
    
    describe '#generateColumnsPopup', ->
      it "should include popup item for a column", ->
        a = @tableView.generateColumnsPopup()
        a.length.should equal(2)
      
      it "should display checkmark for visible column", ->
        a = @tableView.generateColumnsPopup()
        a[0].title.should equal('&#x2714; Name')
        
      it "should not display checkmark for hidden column", ->
        @tableView.toggleColumn @tableView.columns()[0]
        a = @tableView.generateColumnsPopup()
        a[0].title.should equal('Name')
      
      it "should not include column with non-screen media type", ->
        @tableView.columns()[0].media = 'print'
        a = @tableView.generateColumnsPopup()
        a.length.should equal(1)
      
      it "should assign action to toggle column visibility", ->
        a = @tableView.generateColumnsPopup()
        a[0].action.should beAFunction
    
    describe '#listItemAdded', ->
      beforeEach ->
        @tableView.load()
        @list.add {name: 'Fred', age: 19}
            
      it "should generate row for new item", ->
        $('tr.item3', @tableView.element()).length.should equal(1)
      
      it "should activate row", ->
        item = {}
        @tableView.shouldReceive('activateRow').with(item)
        @list.add item
      
      it "should add _mapping for new item", ->
        @tableView._mapping.indexOf(3).shouldNot equal(-1)
        
      it "should sort items", ->
        @tableView.shouldReceive 'sort'
        @list.add {name: 'Jane', age: 44}
    
    describe '#listItemRemoved', ->
      beforeEach ->
        @tableView.load()
    
      it "should remove row for item", ->
        @list.removeAt 0
        $('tbody tr', @tableView.element()).length.should equal(2)
      
      it "should renumber rows", ->
        @list.removeAt 1
        rows = $('tbody tr', @tableView.element())
        rows[0].className.should equal('item1')
        rows[1].className.should equal('item0')
      
      it "should rebuild _mapping", ->
        @tableView.shouldReceive 'createMapping'
        @list.removeAt 0
      
      it "should re-sort", ->
        @tableView.shouldReceive 'sort'
        @list.removeAt 0
    
    describe '#listItemChanged', ->
      beforeEach ->
        @item = ST.Object.create()
        @list.add @item
        @tableView.load()
      
      it "should refresh row", ->
        @tableView.shouldReceive('refreshRow').with(@item)
        @item.trigger 'changed'
      
      it "should sort items", ->
        @tableView.shouldReceive 'sort'
        @item.trigger 'changed'
    
    describe '#print', ->
      beforeEach ->
        @tableView.helper().print = ->
      
      it "should generate header HTML", ->
        @tableView.shouldReceive('generateHeaderHTML')
        @tableView.print()
      
      it "should generate body HTML", ->
        @tableView.shouldReceive('generateBodyHTML')
        @tableView.print()
      
      it "should print", ->
        @tableView.helper().shouldReceive 'print'
        @tableView.print()