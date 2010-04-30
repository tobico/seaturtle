STView.subClass('STTableView', {
    
    initWithCollection: function(collection)
    {
        this.init();
        
        this.columns = new STArray();
        this.rows = new STArray();
        this.itemRows = {};
        this.setCollection(collection);
        this.sortColumn = false;
        this.tableElement = null;
    },
    
    destroy: function()
    {
        this.releaseMembers('collection');
        this._super();
    },
    
    columns:            ST.$property,
    collection:         ST.$property('retain'),
    sortColumn:         ST.$property,
    tableElement:       ST.$property(null, 'readonly'),
    
    setCollection: function(collection)
    {
        if (collection) collection.retain();
        if (this.collection) {
            this.collection.unbindAll(this);
            this.collection.release();
        }
        this.collection = collection;
        collection.bind('itemAdded', this, 'collectionItemAdded');
        collection.bind('itemRemoved', this, 'collectionItemRemoved');
    },
    
    setColumns: function(columns)
    {
        this.columns = ST.A(columns);
        if (this.sortColumn == false && this.columns.length) {
            this.setSortColumn(this.columns[0]);
        }
        if (this.loaded) this.reload();
    },
    
    setSortColumn: function(sortColumn)
    {
        var oldSortColumn = this.sortColumn;
        this.sortColumn = sortColumn;
        
        this.refreshColumnHeader(oldSortColumn);
        this.refreshColumnHeader(sortColumn);
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
        
        self.rows.empty();
        this.collection.each(function(item) {
            self.addRow(item);
        });
    },
    
    renderRow: function(row)
    {
        row.empty();
        var skip = 0;
        this.columns.each(function(column) {
            if (skip > 0) {
                skip--;
                return;
            }
            var value = false;
            var cell = ST.tdTag();
            if (column.value) {
                value = column.value(row.item);
            } else if (column.field) {
                value = row.item.get(column.field);
            }
            if (column.display) {
                column.display(cell, row.item, value);
                var colSpan = cell.attr('colspan');
                if (colSpan > 1) skip += colSpan - 1;
            } else {
                cell.append(value);
            }
            row.append(cell);
        });        
    },
    
    addRow: function(item)
    {
        var row = ST.trTag();
        row.item = item;
        this.itemRows[item._uid] = row;
        item.bind('changed', this, 'itemChanged');
        this.renderRow(row);
        this.rows.push(row);
        this.tableElement.append(row);
    },
    
    removeRow: function(item)
    {
        item.unbind('changed', this);
        if (this.itemRows[item._uid]) {
            var row = this.itemRows[item._uid];
            this.rows.remove(row);
            delete row.item;
            row.remove();
            delete this.itemRows[item._uid];
        }
    },
    
    refresh: function()
    {
        var self = this;
        this.rows.each(function(row) {
            self.renderRow(row);
        });
    },
    
    refreshItem: function(item)
    {
        if (this.itemRows[item._uid]) {
            this.renderRow(this.itemRows[item._uid]);
        }
    },
     
    renderHeaderForColumn: function(column)
    {
        var self = this;
        
        var cell = ST.thTag().css('cursor', 'pointer').click(function() {
            self.setSortColumn(column);
        });
        column.header = cell;
        
        self.refreshColumnHeader(column);
        
        return cell;
    },
    
    refreshColumnHeader: function(column)
    {   
        if (!column.header) return;
        column.header.html(column.title);
        
        if (column == this.sortColumn) {
            column.header.append(ST.spanTag('&#x2193;').addClass('sortLabel'));
        }
    },
    
    collectionItemAdded: function(array, item)
    {
        this.addRow(item);
    },
    
    collectionItemRemoved: function(array, item)
    {
        this.removeRow(item);
    },
    
    itemChanged: function(item)
    {
        if (this.itemRows[item._uid]) {
            this.renderRow(this.itemRows[item._uid]);
        }
    },
    
end:0});