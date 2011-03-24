#require ST/TableView

$ ->
  Spec.describe 'TableView', ->
    beforeEach ->
      @list = ST.List.create()
      @list.add {name: 'Bob',   age: 17}
      @list.add {name: 'Eliza', age: 28}
      @list.add {name: 'Steve', age: 22}
      @tableView = ST.TableView.createWithList @list
    
    describe '#initWithList', ->
      it "should set defaults"
      it "should set list"
      it "should add instance to ST.TableView.Instances"
    
    describe '#destroy', ->
      it "should remove instance from ST.TableView.Instances"
    
    describe '#setList', ->
      it "should set list"
      it "should unbind old list"
      it "should bind new list"
      it "should rebuild mapping"
    
    describe '#setColumns', ->
      it "should set column indexes"
      it "should set default sort column"
      it "should refresh header and body when loaded"
      it "should not refresh header or body when not loaded"
    
    describe '#sortFunction', ->
      it "should sort with custom sort function in ascending order"
      it "should sort with custom sort function in descending order"
      it "should sort with default sort function in ascending order"
      it "should sort with default sort function in descending order"
    
    describe '#setSortColumn', ->
      it "should accept an index"
      it "should set sort column"
      it "should toggle _reverseSort when set to same value"
      it "should set _reverseSort to false when set to different value"
      it "should refresh header and sort if loaded"
    
    describe '#sort', ->
      it "should sort _mapping"
      it "should rearrage table rows"
      
    describe '#positionRow', ->
      it "should update item position in _mapping"
      it "should rearrange item row"
    
    describe '#render', ->
      it "should render table"
      it "should append tableElement to element"
    
    describe '#renderTable', ->
      it "should create _tableElement"
      it "should set table CSS class"
      it "should load table element HTML"
      it "should active table header"
    
    describe '#generateHeaderHTML', ->
      it "should wrap header innerHTML in <thead> tag"
    
    describe '#generateHeaderInnerHTML', ->
      it "should be wrapped in a tr tag"
      it "should generate HTML for each column header"
      it "should not include hidden column"
      it "should not include column with wrong media type"
      it "should generate customize columns button"
    
    describe '#activateHeader', ->
      it "should assign popup to customize columns button"
    
    describe '#generateColumnHeaderHTML', ->
      it "should generate <th> html"
      it "should generate onclick event to sort by column"
      it "should include column title"
      it "should display ascending sort marker"
      it "should display descending sort marker"
    
    describe '#generateBodyHTML', ->
      it "should wrap body innerHTML in <tbody> tag"
    
    describe '#generateBodyInnerHTML', ->
      it "should generate HTML for each row"
    
    describe '#generateRowHTML', ->
      it "should wrap row innerHTML in a <tr> tag"
      it "should include item index as a CSS class"
    
    describe '#generateRowInnerHTML', ->
      it "should generate cell HTML"
      it "should skip cell for hidden column"
      it "should skip cell for column with wrong media type"
    
    describe '#generateCellHTML', ->
      it "should wrap cell innerHTML in a <td> tag"
    
    describe '#generateCellInnerHTML', ->
      it "should call custom column html generator"
      it "should display cell value if no custom generator"      
      
    describe '#cellValue', ->
      it "should call custom value generator"
      it "should get value for field of ST.Object"
      it "should get value for field of non-ST.Object"
    
    describe '#refreshHeader', ->
      it "should regenerate header innerHTML"
      it "should reactive header"
    
    describe '#refreshBody', ->
      it "should regenerate body innerHTML"
    
    describe '#refreshRow', ->
      it "should regenerate row innerHTML"
    
    describe '#setColumnHidden', ->
      it "should set column.hidden"
      it "should refresh header"
      it "should refresh body"
    
    describe '#toggleColumn', ->
      it "should make visible column hidden"
      it "should make hidden column visible"
    
    describe '#hideColumn', ->
      it "should hide column"
    
    describe '#showColumn', ->
      it "should unhide column"
    
    describe '#generateColumnsPopup', ->
      it "should include popup item for a column"
      it "should display checkmark for visible column"
      it "should not display checkmark for hidden column"
      it "should not include column with wrong media type"
      it "should assign action to toggle column visibility"
    
    describe '#listItemAdded', ->
      it "should assign _uid to non-ST.Object"
      it "should generate row for new item"
      it "should sort new row into tbody"
      it "should sort new row into _mapping"
    
    describe '#listItemRemoved', ->
      it "should remove row for item"
      it "should remove item from _mapping"
    
    describe '#listItemChanged', ->
      it "should refresh row"
      it "should reposition row"
    
    describe '#print', ->
      it "can't be tested"