STView.subClass('STTableViewNode', {

    init: function()
    {
        this.initWithElement(ST.trTag());
        this.tableView = false;
        this.sortColumn = null;
        this.sortDirection = null;
        this.cells = {};
    },
    
    renderRow: function()
    {
        var self = this;
        
        var skip = 0;
        
        self.element.empty();
        self.tableView.columns.each(function(column, i) {
            if (skip) {
                skip--;
                return;
            }
            
            var cell = ST.tdTag().appendTo(self.element);
            self.cells[column] = cell;
            var colspan = self.renderColumn(column, cell);
            if (typeof colspan == 'number') {
                if (colspan < 1) {
                    colspan = self.tableView.columns.length - i;
                }
                if (colspan > 1) {
                    cell.attr('colspan', colspan);
                    skip += colspan - 1;
                }
            }
        });
    },
    
    refreshCell: function(column)
    {
        if (this.cells[column]) {
            this.renderColumn(column, this.cells[column].empty())
        }
    },
    
    loadChildren: function()
    {   
        if (this.tableView.getSortColumn() != false) {
            this.sortChildrenByColumn(this.tableView.getSortColumn(), 1);
        } else {
            this.arrangeChildren();
        }
        
        this.children.each(ST.P('load'));
    },
    
    arrangeChildren: function()
    {
        var node = this;
        
        for (var i = this.children.length - 1; i >= 0; i--) {
            node.element.after(this.children[i].element);
        }
    },
    
    render: function()
    {
        this.renderRow();
    },
    
    renderColumn: ST.$virtual('column', 'cell'),
    sortValueForColumn: ST.$virtual('column'),
    
    addChild: function(child)
    {
        this._super(child);
        child.tableView = this.tableView;
        if (this.loaded) child.load();
    },
    
    sortChildrenByColumn: function(column, direction) {
        this.sortColumn = column;
        this.sortDirection = column;
        
        this.children.sort(ST.makeSortFn(function(a) {
            return a.sortValueForColumn(column) || 0;
        }));
        
        this.arrangeChildren();
        this.children.each(function(child) {
            child.sortChildrenByColumn(column, direction);
        });
    },
    
    resort: function()
    {
        if (this.sortColumn != null && this.sortDirection != null) {
            this.sortChildrenByColumn(this.sortColumn, this.sortDirection);
        }
    },
    
    addToNode: function(node)
    {
        node.addChild(this);
    },

end
:0});