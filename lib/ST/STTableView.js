STView.subClass('STTableView', {
    
    initWithCollection: function(collection)
    {
        this.init();
        
        this.columns = new STArray();
        this.rows = new STArray();
        this.itemRows = {};
        this.setCollection(collection);
        this.sortColumn = false;
        this.reverseSort = false;
        this.mainElement = null;
        this.tableElement = null;
        this.tbodyElement = null;
        this.actionsDisplay = null;
        this.groupBy = null;
        this.groups = {};
        this.filter = null;
    },
    
    destroy: function()
    {
        this.releaseMembers('collection');
        this._super();
    },
    
    columns:            ST.$property,
    collection:         ST.$property('retain'),
    sortColumn:         ST.$property,
    reverseSort:        ST.$property,
    actionsDisplay:     ST.$property,
    mainElement:        ST.$property(null, 'readonly'),
    tableElement:       ST.$property(null, 'readonly'),
    tbodyElement:       ST.$property(null, 'readonly'),
    filter:             ST.$property,
    
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
    
    setColumns: function(columns, sortColumnIndex)
    {
        this.columns = ST.A(columns);
        if (this.sortColumn == false && this.columns.length) {
            this.setSortColumn(this.columns[sortColumnIndex || 0]);
        }
        if (this.loaded) this.refreshHeaders();
    },
    
    addColumn: function(column)
    {
        this.columns.push(column);
        if (this.loaded) this.refreshHeaders();
    },
    
    setSortColumn: function(sortColumn)
    {
        var self = this;
        var oldSortColumn = this.sortColumn;
        if (oldSortColumn == sortColumn) {
            this.reverseSort = !this.reverseSort
        } else {
            this.reverseSort = false;
        }
        this.sortColumn = sortColumn;
        
        this.rows.sort(ST.makeSortFn(function(row) {
            return self.getCellValue(sortColumn, row);
        }, this.reverseSort));
        
        if (this.groupBy) {
            this.groupBy = sortColumn;
            this.renderMain();
        } else {
            this.rows.each(function(row) {
                self.tbodyElement.append(row);
            });
        
            this.refreshColumnHeader(oldSortColumn);
            this.refreshColumnHeader(sortColumn);
        }
    },
    
    setFilter: function(filter)
    {
        if (filter == this.filter) return;
        this.filter = filter;
        this.refilter();
    },
    
    refilter: function()
    {
        if (!this.loaded) return;
        
        var self = this;
        if (this.filter) {
            this.rows.each(function(row) {
                if (self.filter(row.item)) {
                    row.show();
                } else {
                    row.hide();
                }
            });
        } else {
            this.rows.each(function(row) {
                row.show();
            });
        }
    },
    
    reload: function()
    {
        this.error('STTableView reloaded');
    },
    
    render: function(element)
    {
        this._super(element);
        this.mainElement = ST.divTag().appendTo(element);
        this.renderMain();
    },
    
    renderMain: function()
    {
        var self = this;
        
        this.loadRows();
        this.rows.each(function(row) {
            row.detach();
        });
        this.mainElement.empty();
        
        if (this.groupBy) {
            this.getGroupValues().each(function(value) {
                var group = {};
                self.groups[value] = group;
                self.renderTable(group);
                self.mainElement.append(ST.h3Tag(value))
                    .append(group.tableElement);
            });
            this.rows.each(function(row) {
                var value = self.getCellValue(self.groupBy, row);
                self.groups[value].tbodyElement.append(row);
            });
        } else {
            this.renderTable(this);
            self.mainElement.append(this.tableElement);
            this.rows.each(function(row) {
                self.tbodyElement.append(row);
            });
        }
    },
    
    renderTable: function(object)
    {
        var self = this;
        
        object.tableElement = ST.tableTag().addClass('tableView');
        object.tbodyElement = ST.tbodyTag().appendTo(object.tableElement);

        object.tableElement.prepend(ST.theadTag(this.renderHeader()))
    },
    
    renderHeader: function()
    {
        var self = this;
        
        var header = ST.trTag();
        this.columns.each(function(column) {
            if (column.hidden) return;
            header.append(self.renderHeaderForColumn(column));
        });
        
        header.append(ST.thTag(
            ST.aTag()
              .addClass('columnsButton')
              .hover(function() { $(this).addClass('columnsButtonHover'); },
                     function() { $(this).removeClass('columnsButtonHover'); })
              .popup(this.methodFn('generateColumnsPopup'))
        ).addClass('actions'));
        return header;
    },
    
    renderRow: function(row)
    {
        var self = this;
        row.empty();
        var skip = 0;
        this.columns.each(function(column) {
            if (column.hidden) return;
            if (skip > 0) {
                skip--;
                return;
            }
            var cell = ST.tdTag();
            skip += self.renderCell(cell, column, row);
            row.append(cell);
        });
        var actionsCell = ST.tdTag().appendTo(row);
        if (this.actionsDisplay) {
            this.actionsDisplay(actionsCell, row.item);
        }
    },
    
    renderCell: function(cell, column, row)
    {
        var skip = 0;
        var value = this.getCellValue(column, row);
        if (column.display) {
            column.display(cell, row.item, value);
            var colSpan = cell.attr('colspan');
            if (colSpan > 1) skip += colSpan - 1;
        } else {
            cell.append(value);
        }
        return skip;
    },
    
    getCellValue: function(column, row)
    {
        var value = false;
        
        if (column.value) {
            value = column.value(row.item);
        } else if (column.field) {
            value = row.item.get ? row.item.get(column.field) : row.item[column.field];
            if (value === row.item) value = null;
        }
        
        return value;
    },
    
    getGroupValues: function()
    {
        var self = this;
        return this.rows.map(function(row) {
            return self.getCellValue(self.groupBy, row);
        }).unique();
    },
    
    loadRows: function()
    {
        if (this.rows.length) return;

        var self = this;
        
        this.collection.each(function(item) {
            self.addRow(item);
        });
    },
    
    addRow: function(item)
    {
        var row = ST.trTag();
        row.item = item;
        this.itemRows[item._uid] = row;
        if (item.bind) item.bind('changed', this, 'itemChanged');
        this.renderRow(row);
        if (this.filter && !this.filter(row.item)) row.hide();
        this.rows.push(row);
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
    
    refreshHeaders: function()
    {
        var self = this;
        $('thead', this.element).each(function() {
            $(this).empty().append(self.renderHeader());
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
            column.header.append(ST.spanTag(
                this.reverseSort ? ' &#x2191;' : ' &#x2193;'
            ).addClass('sortLabel'));
        }
    },
    
    setColumnHidden: function(column, hidden)
    {
        column.hidden = hidden;
        this.refresh();
        this.renderMain();        
    },
    
    toggleColumn: function(column)
    {
        this.setColumnHidden(column, !column.hidden);
    },

    hideColumn: function(column)
    {
        this.setColumnHidden(column, true);
    },
    
    showColumn: function(column)
    {
        this.setColumnHidden(column, false);
    },
        
    generateColumnsPopup: function()
    {
        var self = this;

        var a = [];
        this.columns.each(function(column) {
            a.push({
                title: (column.hidden ? '' : '&#x2714; ') + (column.fullTitle || column.title),
                action: function() { self.toggleColumn(column); }
            });
        });
        a.push('-', {
            title: (self.groupBy ? '&#x2714; ' : '') + 'Grouped',
            action: function() {
                self.groupBy = self.groupBy ? null : self.getSortColumn();
                self.renderMain();
            }
        })
        return a;
    },
    
    collectionItemAdded: function(array, item)
    {
        this.addRow(item);
        if (this.groupBy) {
        } else if (this.tbodyElement) {
            this.tbodyElement.append(this.rows.last());
        }
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