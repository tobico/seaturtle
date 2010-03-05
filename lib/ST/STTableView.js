STView.subClass('STTableView', {
    
    DelegateProtocol: new STArray('tableViewRenderHeaderForColumn'),
    
    init: function()
    {
        this._super();
        
        this.columns = new STArray();
        this.columnHeaders = {};
        this.sortColumn = false;
        this.rootNode = new STTableViewRootNode().init();
        this.rootNode.tableView = this;
        this.tableElement = null;
        this.delegate = false;
    },
    
    destroy: function()
    {
        this.rootNode.release();
        this._super();
    },
    
    columns:      ST.$property(),
    sortColumn:   ST.$property(),
    tableElement: ST.$property(null, 'readonly'),
    rootNode:     ST.$property('retain', 'readonly'),
    
    setDelegate: function(delegate)
    {
        this.delegate = delegate;
        if (!delegate.conformsToProtocol(STTableView.DelegateProtocol)) {
            ST.error('STTableView delegate does not conform to delegate protocol');
        }
    },
    
    setColumns: function(columns)
    {
        this.columns = columns;
        if (this.sortColumn == false && columns.length) {
            this.setSortColumn(columns[0]);
        }
        if (this.loaded) this.reload();
    },
    
    setSortColumn: function(sortColumn)
    {
        var oldSortColumn = this.sortColumn;
        this.sortColumn = sortColumn;
        
        this.refreshColumnHeader(oldSortColumn);
        this.refreshColumnHeader(sortColumn);
        
        this.rootNode.sortChildrenByColumn(sortColumn, 1);
    },
    
    render: function(element)
    {
        this._super(element);
        
        var self = this;
        
        this.tableElement = ST.tableTag().addClass('tableView');
        element.append(this.tableElement);
        
        if (!this.columns.length) return;
        
        var header = ST.trTag().appendTo(ST.theadTag().appendTo(this.tableElement));
        this.columns.each(function(column) {
            header.append(self.renderHeaderForColumn(column));
        });
        
        this.tableElement.append(this.rootNode.getElement());
        this.rootNode.load();
    },
    
    resort: function()
    {
        this.rootNode.sortChildrenByColumn(this.sortColumn, 1);
    },
    
    addNode: function(child)
    {
        this.rootNode.addChild(child);
    },
    
    removeNode: function(child)
    {
        child.parent.removeChild(child);
    },
    
    addAndReleaseNode: function(child)
    {
        this.rootNode.addAndReleaseChild(child);
    },
    
    emptyNodes: function()
    {
        this.rootNode.empty();
    },
    
    findNode: function(callback)
    {
        return this.rootNode.findChild(callback);
    },
    
    renderHeaderForColumn: function(column)
    {
        var tv = this;
        
        var cell = ST.thTag().css('cursor', 'pointer').click(function() {
            tv.setSortColumn(column);
        });
        
        tv.columnHeaders[column] = cell;
        
        tv.refreshColumnHeader(column);
        
        return cell;
    },
    
    refreshColumnHeader: function(column)
    {
        if (!this.columnHeaders[column]) return;
        
        var cell = this.columnHeaders[column];
        
        if (this.delegate) {
            this.delegate.tableViewRenderHeaderForColumn(this, column, cell.empty());
        } else {
            cell.html(column);
        }
        
        if (column == this.sortColumn) {
            cell.append(ST.spanTag('&#x2193;').addClass('sortLabel'));
        }
    },
    
end:0});