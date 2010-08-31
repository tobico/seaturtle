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
        this.showActions = true;
        this.groupBy = null;
        this.groups = {};
        this.filter = null;
        this.ignoreChanges = {};
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
    tableClass:         ST.$property,
    mainElement:        ST.$property(null, 'readonly'),
    tableElement:       ST.$property(null, 'readonly'),
    tbodyElement:       ST.$property(null, 'readonly'),
    filter:             ST.$property,
    showActions:        ST.$property,
    
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
        this.columns = columns;
        if (columns.prototype != STArray) this.columns = ST.A(this.columns);
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
    
    getSortFunction: function()
    {
        var self = this;
        
        if (this.sortColumn.sort) {
            var sortMultiply = this.reverseSort ? -1 : 1;
            return function(a, b) {
                return self.sortColumn.sort(a.item, b.item) * sortMultiply;
            }
        } else {
            return ST.makeSortFn(function(row) { 
                return self.getCellValue(self.sortColumn, row);
            }, this.reverseSort); 
        }
    },
    
    setSortColumn: function(sortColumn, reverseSort)
    {
        var self = this;
        var oldSortColumn = this.sortColumn;
        if (reverseSort !== undefined) {
            this.reverseSort = reverseSort;
        } if (oldSortColumn == sortColumn) {
            this.reverseSort = !this.reverseSort
        } else {
            this.reverseSort = sortColumn.reverse || false;
        }
        this.sortColumn = sortColumn;
        
        this.sort()
        
        if (this.groupBy) {
            this.groupBy = sortColumn;
            this.renderMain();
        } else {
            this.refreshColumnHeader(oldSortColumn);
            this.refreshColumnHeader(sortColumn);
        }
    },
    
    sort: function()
    {
        var self = this;
        
        this.rows.sort(this.getSortFunction());        
        
        if (this.loaded) {
            if (this.groupBy) {
            
            } else {
                this.rows.each(function(row) {
                    self.tbodyElement.append(row);
                });
            }
        }
    },
    
    sortRow: function(row)
    {
        var inPlace = false;
        var sortFunction = this.getSortFunction();
        var startIndex = this.rows.indexOf(row);
        var index = startIndex;
        var oldTop = row.offset().top;
        
        while (!inPlace) {
            if (index > 0 && sortFunction(row, this.rows[index - 1]) < 0) {
                this.rows[index] = this.rows[index - 1];
                this.rows[index - 1] = row;
                index--;
            } else if (index < (this.rows.length - 1) && sortFunction(row, this.rows[index + 1]) > 0) {
                this.rows[index] = this.rows[index + 1];
                this.rows[index + 1] = row;
                index++;
            } else {
                inPlace = true;
            }
        }
        if (index == startIndex) return;
        
        if (index > 0) {
            this.rows[index - 1].after(row);
        } else {
            this.tbodyElement.prepend(row);
        }
    },
    
    setSort: function(id, reverse)
    {
        column = this.columns[id];
        this.setSortColumn(column, reverse);
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
                    row.css('display', 'table-row');
                } else {
                    row.hide();
                }
            });
        } else {
            this.rows.each(function(row) {
                row.css('display', 'table-row');
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
        
        this.refresh();
    },
    
    renderTable: function(object)
    {
        var self = this;
        
        object.tableElement = ST.tableTag().addClass('tableView');
        if (this.tableClass) object.tableElement.addClass(this.tableClass);
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
        
        if (this.showActions) {
            header.append(ST.thTag(
                ST.aTag()
                  .addClass('columnsButton')
                  .hover(function() { $(this).addClass('columnsButtonHover'); },
                         function() { $(this).removeClass('columnsButtonHover'); })
                  .popup(this.methodFn('generateColumnsPopup'))
            ).addClass('actions'));
        }
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
            row.append(cell);
            skip += self.renderCell(cell, column, row);
        });
        if (this.showActions) {
            var actionsCell = ST.tdTag().appendTo(row);
            if (this.actionsDisplay) {
                this.actionsDisplay(actionsCell, row.item);
            }
        }
    },
        
    renderCell: function(cell, column, row)
    {
        var skip = 0;
        var value = this.getCellValue(column, row);
        if (column.display) {
            column.display(cell, row.item, value, row);
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
            value = row.item && (row.item.get ? row.item.get(column.field) : STObject.prototype.get.call(row.item, column.field));
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
            self.rows.push(self.makeRow(item));
        });
        this.sort();
    },
    
    makeRow: function(item)
    {
        var row = ST.trTag();
        row.item = item;
        this.itemRows[item._uid] = row;
        if (item.bind) item.bind('changed', this, 'itemChanged');
        if (this.filter && !this.filter(row.item)) row.hide();
        return row;
    },
    
    removeRow: function(item)
    {
        item.unbind('changed', this);
        if (this.itemRows[item._uid]) {
            var row = this.itemRows[item._uid];
            delete this.itemRows[item._uid];
            this.rows.remove(row);
            row.item = null;
            row.remove();
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
        //Check that item doesn't already have a row
        if (this.itemRows[item._uid] !== undefined) return;
        
        var row = this.makeRow(item);
        if (this.groupBy) {

        } else if (this.tbodyElement) {
            var index = 0;
            var sortFn = this.getSortFunction();
            while (index < this.rows.length && sortFn(row, this.rows[index]) >= 0) index++;
            
            if (index < (this.rows.length - 1)) {
                this.rows.insert(index + 1, row)
                this.rows[index].after(row);
            } else {
                this.rows.push(row);
                this.tbodyElement.append(row);
            }
        }
        this.renderRow(row);
    },
    
    collectionItemRemoved: function(array, item)
    {
        this.removeRow(item);
    },
    
    ignoreChange: function(item, number)
    {
        this.ignoreChanges[item._uid] = (this.ignoreChanges[item._uid] || 0) + (number || 1);
    },
    
    itemChanged: function(item)
    {
        if (this.itemRows[item._uid]) {
            this.sortRow(this.itemRows[item._uid]);
            if (this.ignoreChanges[item._uid]) {
                this.ignoreChanges[item._uid]--;
            } else {
                this.renderRow(this.itemRows[item._uid]);
            }
        }
    },
    
end:0});