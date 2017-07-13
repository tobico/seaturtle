/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/TableView

Spec.describe('TableView', function() {
  beforeEach(function() {
    this.list = ST.List.create();
    this.list.add({name: 'Zack',  age: 17});
    this.list.add({name: 'Eliza', age: 28});
    this.list.add({name: 'Steve', age: 22});
    this.tableView = ST.TableView.createWithList(this.list);
    return this.tableView.columns([new SpecObject({
      field: 'name',
      title: 'Name'
    }), new SpecObject({
      field: 'age',
      title: 'Age'
    })]);});
  
  describe('#initWithList', function() {
    beforeEach(function() {
      this.list = ST.List.create();
      this.tableView = new ST.TableView;
      return this.tableView.initWithList(this.list);
    });
    
    it("should add instance to ST.TableView.Instances", function() {
      const id = this.tableView._id;
      id.should(beAnInstanceOf(Number));
      return ST.TableView.Instances[id].should(be(this.tableView));
    });
    
    it("should set defaults", function() {
      this.tableView.columns().should(equal([]));
      this.tableView._ordered.should(equal([]));
      expect(this.tableView.sortColumn()).to(be(null));
      this.tableView.reverseSort().should(beFalse);
      expect(this.tableView.tableClass()).to(be(null));
      expect(this.tableView.tableElement()).to(be(null));
      return this.tableView.canCustomizeColumns().should(beTrue);
    });
    
    return it("should set list", function() {
      return this.tableView._list.should(be(this.list));
    });
  });
  
  describe('#destroy', () =>
    it("should remove instance from ST.TableView.Instances", function() {
      const id = this.tableView._id;
      this.tableView.release();
      return expect(ST.TableView.Instances[id]).to(be(null));
    })
  );
  
  describe('#setList', function() {
    it("should set list", function() {
      const list = ST.List.create();
      this.tableView.list(list);
      return this.tableView._list.should(be(list));
    });
    
    it("should unbind old list", function() {
      this.list.shouldReceive('unbindAll').with(this.tableView);
      return this.tableView.list(null);
    });
    
    return it("should bind new list", function() {
      const list = ST.List.create();
      list.shouldReceive('bind').exactly(3).times;
      return this.tableView.list(list);
    });
  });
  
  describe('#setColumns', function() {
    beforeEach(function() {
      this.columns = [{}, {}];
      return this.tableView.columns(this.columns);
    });
  
    it("should set column indexes", function() {
      this.columns[0].index.should(equal(0));
      return this.columns[1].index.should(equal(1));
    });
    
    it("should set default sort column", function() {
      return expect(this.tableView.sortColumn()).to(be(this.columns[0]));
    });
    
    it("should refresh header and body when loaded", function() {
      this.tableView.load();
      this.tableView.shouldReceive('refreshHeader');
      this.tableView.shouldReceive('refreshBody');
      return this.tableView.columns(this.columns);
    });
    
    return it("should not refresh header or body when not loaded", function() {
      this.tableView.shouldNotReceive('refreshHeader');
      this.tableView.shouldNotReceive('refreshBody');
      return this.tableView.columns(this.columns);
    });
  });
  
  describe('#sortFunction', function() {
    context('with a custom sort function', function() {
      beforeEach(function() {
        this.sortFn = (a, b) => 0;
        return this.tableView.columns([{
          sort: this.sortFn
        }]);});
      
      return it("should return the custom sort function", function() {
        return this.tableView.sortFunction().should(be(this.sortFn));
      });
    });
    
    it("should sort with default sort function in ascending order", function() {
      this.list._array.sort(this.tableView.sortFunction());
      return this.list.first().name.should(equal('Eliza'));
    });
    
    return it("should sort with default sort function in descending order");
  });
  
  describe('#setSortColumn', function() {
    it("should accept an index", function() {
      this.tableView.sortColumn(1);
      return expect(this.tableView.sortColumn()).to(be(this.tableView.columns()[1]));
    });
    
    it("should set sort column", function() {
      const column = this.tableView.columns()[0];
      this.tableView.sortColumn(column);
      return expect(this.tableView.sortColumn()).to(be(column));
    });
    
    it("should toggle _reverseSort when set to same value", function() {
      this.tableView.sortColumn(0);
      return this.tableView.reverseSort().should(beTrue);
    });
    
    it("should set _reverseSort to false when set to different value", function() {
      this.tableView.sortColumn(1);
      return this.tableView.reverseSort().should(beFalse);
    });
    
    it("should resort items", function() {
      this.tableView.shouldReceive('sort');
      return this.tableView.sortColumn(0);
    });
    
    return it("should refresh header if loaded", function() {
      this.tableView.load();
      this.tableView.shouldReceive('refreshHeader');
      return this.tableView.sortColumn(0);
    });
  });
  
  describe('#sort', () =>
    it("should rearrage table rows", function() {
      this.tableView.load();
      this.tableView.sort();
      const rows = $('tr td:first-child', this.tableView.element());
      rows[0].innerHTML.should(equal('Eliza'));
      rows[1].innerHTML.should(equal('Steve'));
      return rows[2].innerHTML.should(equal('Zack'));
    })
  );
  
  describe('#render', function() {
    it("should render table", function() {
      this.tableView.shouldReceive('renderTable');
      return this.tableView.render();
    });
    
    it("should append tableElement to element", function() {
      this.tableView.render();
      return $('table', this.tableView.element()).length.should(equal(1));
    });
    
    return it("should render columns button", function() {
      this.tableView.shouldReceive('renderColumnsButton');
      return this.tableView.render();
    });
  });
  
  describe('#renderTable', function() {
    it("should create _tableElement", function() {
      this.tableView.renderTable();
      return this.tableView.tableElement().should(beAnInstanceOf(jQuery));
    });
    
    it("should set table CSS class", function() {
      this.tableView.tableClass('banana');
      this.tableView.renderTable();
      return this.tableView.tableElement().is('.banana').should(beTrue);
    });
    
    return it("should activate body", function() {
      this.tableView.shouldReceive('activateBody');
      return this.tableView.renderTable();
    });
  });
  
  describe("#renderColumnsButton", () =>
    it("should append a columns button", function() {
      this.tableView.renderColumnsButton();
      return $('.columnsButton', this.tableView.element()).length.should(equal(1));
    })
  );
  
  describe('#generateHeaderInnerHTML', function() {
    it("should be wrapped in a TR tag", function() {
      const html = [];
      this.tableView.generateHeaderInnerHTML(html);
      html.indexOf('<tr>').should(equal(0));
      return html.indexOf('</tr>').should(equal(html.length - 1));
    });
    
    it("should generate HTML for each column header", function() {
      const html = [];
      this.tableView.generateHeaderInnerHTML(html);
      html.indexOf('Name').shouldNot(equal(-1));
      return html.indexOf('Age').shouldNot(equal(-1));
    });
    
    it("should not include hidden column", function() {
      this.tableView.toggleColumn(this.tableView.columns()[1]);
      const html = [];
      this.tableView.generateHeaderInnerHTML(html);
      return html.indexOf('Age').should(equal(-1));
    });
      
    return it("should not include column with wrong media type", function() {
      this.tableView.columns()[1].media = 'print';
      const html = [];
      this.tableView.generateHeaderInnerHTML(html);
      return html.indexOf('Age').should(equal(-1));
    });
  });
      
  describe('#generateColumnHeaderHTML', function() {
    it("should generate TH html", function() {
      let html = [];
      this.tableView.generateColumnHeaderHTML(this.tableView.columns()[0], html);
      html = html.join('');
      html.indexOf('<th').should(equal(0));
      return html.indexOf('</th>').shouldNot(equal(-1));
    });
    
    it("should generate onclick event to sort by column", function() {
      let html = [];
      this.tableView.generateColumnHeaderHTML(this.tableView.columns()[0], html);
      html = html.join('');
      return html.indexOf('onclick').shouldNot(equal(-1));
    });
    
    it("should include column title", function() {
      const html = [];
      this.tableView.generateColumnHeaderHTML(this.tableView.columns()[0], html);
      return html.indexOf('Name').shouldNot(equal(-1));
    });
    
    it("should display ascending sort marker", function() {
      const html = [];
      this.tableView.generateColumnHeaderHTML(this.tableView.columns()[0], html);
      return html.indexOf(' &#x2193;').shouldNot(equal(-1));
    });
    
    return it("should display descending sort marker", function() {
      const html = [];
      this.tableView.sortColumn(0);
      this.tableView.generateColumnHeaderHTML(this.tableView.columns()[0], html);
      return html.indexOf(' &#x2191;').shouldNot(equal(-1));
    });
  });
  
  describe('#generateBodyInnerHTML', () =>
    it("should generate HTML for each row", function() {
      this.tableView.shouldReceive('generateRowHTML').exactly(3).times;
      const html = [];
      return this.tableView.generateBodyInnerHTML(html);
    })
  );
  
  describe("#activateBody", () => it("should activate each row"));
  
  describe('#generateRowHTML', () =>
    it("should wrap row innerHTML in a <tr> tag", function() {
      const html = [];
      this.tableView.shouldReceive('generateRowInnerHTML');
      this.tableView.generateRowHTML(this.tableView.list().at(0), html);
      html[0].should(equal('<tr data-uid="'));
      return html[html.length-1].should(equal('</tr>'));
    })
  );
    
  describe('#cellValue', function() {
    it("should call custom value generator", function() {
      const item = this.tableView.list().at(0);
      const column = this.tableView.columns()[0];
      column.shouldReceive('value');
      return this.tableView.cellValue(item, column);
    });
    
    it("should get value for field of ST.Object", function() {
      const item = ST.Object.create();
      item.foo = () => 'bacon';
      const column = {field: 'foo'};
      return this.tableView.cellValue(item, column).should(equal('bacon'));
    });
    
    return it("should get value for field of non-ST.Object", function() {
      const item = {foo: 'bacon'};
      const column = {field: 'foo'};
      return this.tableView.cellValue(item, column).should(equal('bacon'));
    });
  });
  
  describe('#refreshHeader', () =>
    it("should regenerate header innerHTML", function() {
      this.tableView.load();
      this.tableView.shouldReceive('generateHeaderInnerHTML');
      return this.tableView.refreshHeader();
    })
  );
  
  describe('#refreshBody', () =>
    it("should regenerate body innerHTML", function() {
      this.tableView.load();
      this.tableView.shouldReceive('generateBodyInnerHTML');
      return this.tableView.refreshBody();
    })
  );
  
  describe('#refreshRow', function() {
    it("should regenerate row innerHTML", function() {
      this.tableView.load();
      const item = this.tableView.list().at(0);
      this.tableView.shouldReceive('generateRowInnerHTML');
      return this.tableView.refreshRow(item);
    });
    
    return it("should reactivate row", function() {
      this.tableView.load();
      const item = this.tableView.list().at(0);
      this.tableView.shouldReceive('activateRow').with(item);
      return this.tableView.refreshRow(item);
    });
  });
  
  describe('#toggleColumn', function() {
    it("should make visible column hidden", function() {
      const column = this.tableView.columns()[0];
      this.tableView.toggleColumn(column);
      return column.hidden.should(beTrue);
    });
    
    it("should make hidden column visible", function() {
      const column = this.tableView.columns()[0];
      column.hidden = true;
      this.tableView.toggleColumn(column);
      return column.hidden.should(beFalse);
    });

    it("should refresh header", function() {
      const column = this.tableView.columns()[0];
      this.tableView.shouldReceive('refreshHeader');
      return this.tableView.toggleColumn(column);
    });
    
    return it("should refresh body", function() {
      const column = this.tableView.columns()[0];
      this.tableView.shouldReceive('refreshBody');
      return this.tableView.toggleColumn(column);
    });
  });
  
  describe('#generateColumnsPopup', function() {
    it("should include popup item for a column", function() {
      const a = this.tableView.generateColumnsPopup();
      return a.length.should(equal(2));
    });
    
    it("should not include column with non-screen media type", function() {
      this.tableView.columns()[0].media = 'print';
      const a = this.tableView.generateColumnsPopup();
      return a.length.should(equal(1));
    });
    
    return it("should assign action to toggle column visibility", function() {
      const a = this.tableView.generateColumnsPopup();
      return a[0].action.should(beAFunction);
    });
  });
  
  describe('#listItemAdded', function() {
    beforeEach(function() {
      this.tableView.load();
      return this.list.add({name: 'Fred', age: 19});});
          
    it("should generate row for new item", function() {
      return $('tr', this.tableView.element()).length.should(equal(5));
    });
    
    return it("should sort items", function() {
      this.tableView.shouldReceive('sort');
      return this.list.add({name: 'Jane', age: 44});
  });
});
  
  describe('#listItemRemoved', function() {
    beforeEach(function() {
      return this.tableView.load();
    });
  
    return it("should remove row for item", function() {
      this.list.removeAt(0);
      return $('tbody tr', this.tableView.element()).length.should(equal(2));
    });
  });
  
  describe('#listItemChanged', function() {
    beforeEach(function() {
      this.item = ST.Object.create();
      this.list.add(this.item);
      return this.tableView.load();
    });
    
    it("should refresh row", function() {
      this.tableView.shouldReceive('refreshRow').with(this.item);
      return this.item.trigger('changed');
    });
    
    return it("should sort items", function() {
      this.tableView.shouldReceive('sort');
      return this.item.trigger('changed');
    });
  });
  
  return describe('#print', function() {
    beforeEach(function() {
      return this.tableView.helper().print = function() {};
    });
    
    it("should generate table HTML", function() {
      this.tableView.shouldReceive('generateTableHTML');
      return this.tableView.print();
    });
    
    return it("should print", function() {
      this.tableView.helper().shouldReceive('print');
      return this.tableView.print();
    });
  });
});