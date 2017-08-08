import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { BaseView } from './base-view'
import { BaseObject } from '../core/base-object'
import { makeSortFn } from '../util/make-sort-fn'
import { Command } from '../util/command'
import { makePopup } from '../util/popup'

export const TableView = makeClass('TableView', BaseView, (def) => {
  def.GroupingEnabled = false;
  def.Instances = [];
  
  def.initializer('withList', function(list) {
    this.init();
    TableView.Instances.push(this);
    this._id = TableView.Instances.length - 1;
    this._rowsByUid = {};
    this._columns = [];
    this._columnsByName = {};
    this._ordered = [];
    this._sortColumn = null;
    this._reverseSort = false;
    this._tableClass = null;
    this._tableElement = null;
    this._canCustomizeColumns = true;
    this._lang = null;
    return this.list(list);
  });
    
  def.property('columns');
  def.property('list');
  def.property('sortColumn');
  def.property('reverseSort');
  def.property('tableClass');
  def.property('tableElement');
  def.property('canCustomizeColumns');
  def.property('lang');
  
  def.destructor(function() {
    TableView.Instances[this._id] = null;
    return this.super();
  });
  
  def.method('setList', function(newList) {
    const self = this;
    if (newList !== this.list) {    
      if (this._list) {
        this._list.unbindAll(this);
      }
      
      this._list = newList;
      
      if (this._list) {
        this._list.each(function(item) {
          if (!item._uid) { item._uid = BaseObject.UID++; }
          return self._ordered.push(item);
        });
        this._list.bind('itemAdded', this, 'listItemAdded');
        this._list.bind('itemChanged', this, 'listItemChanged');
        return this._list.bind('itemRemoved', this, 'listItemRemoved');
      }
    }
  });

  def.method('setColumns', function(columns, sortColumnIndex, reverseSort) {
    if (sortColumnIndex == null) { sortColumnIndex = 0; }
    if (reverseSort == null) { reverseSort = false; }
    this._columns = columns;
    this._columnsByName = {};
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      column.index = i;
      if (column.name) { this._columnsByName[column.name] = column; }
    }
    if ((columns.length > sortColumnIndex) && (this._sortColumn !== columns[sortColumnIndex])) { this.sortColumn(sortColumnIndex, reverseSort); }
    if (this._loaded) {
      this.refreshHeader();
      return this.refreshBody();
    }
  });
    
  def.method('sortFunction', function(sortColumn) {
    let column;
    const self = this;
    if (column = sortColumn || this._sortColumn) {
      if (column.sortBy) {
        return makeSortFn(column.sortBy, this._reverseSort);
      } else if (column.sort) {
        if (this._reverseSort) {
          return (a, b) => column.sort(b, a);
        } else {
          return column.sort;
        }
      } else {
        return makeSortFn(item => self.cellValue(item, column)
        , this._reverseSort);
      }
    }
  });

  def.method('setSortColumn', function(sortColumn, reverseSort) {
    const self = this;
    if (typeof sortColumn === 'number') { sortColumn = this._columns[sortColumn]; }
    
    const oldSortColumn = this._sortColumn;
    
    if (reverseSort !== undefined) { this._reverseSort = reverseSort; }
      
    if (oldSortColumn === sortColumn) {
      this._reverseSort = !this._reverseSort;
    } else {
      this._reverseSort = !!(sortColumn && sortColumn.reverse);
    }
      
    this._sortColumn = sortColumn;
    
    this.sort();
    
    if (this._loaded) { return this.refreshHeader(); }
  });
  
  def.method('sort', function() {
    let sortFunction;
    const self = this;
    if (sortFunction = this.sortFunction()) {
      this._ordered.sort(sortFunction);
      if (this._loaded) {
        return Array.from(this._ordered).map((item) =>
          this._tbody.append(this._rowsByUid[item._uid]));
      }
    }
  });
  
  def.method('rowFor', function(item) {
    return item && item._uid && this._rowsByUid[item._uid];
  });
  
  def.method('render', function() {
    this.renderTable();
    this.element().append(this._tableElement);
    if (this._canCustomizeColumns) { return this.renderColumnsButton(); }
  });
  
  def.method('renderTable', function() {
    this._tableElement = this.helper().tag('table').addClass('tableView');
    if (this._tableClass) { this._tableElement.addClass(this._tableClass); }
    const html = [];
    this.generateTableHTML(html);
    this._tableElement.html(html.join(''));
    return this.activateBody();
  });
  
  def.method('renderColumnsButton', function() {
    const columnsButton = jQuery('<a class="columnsButton" href="javascript:;">C</a>')
      .mouseover(function() {
        jQuery(this).addClass('columnsButtonHover')
      })
      .mouseout(function() {
        jQuery(this).removeClass('columnsButtonHover')
      })
    this.element().append(columnsButton);
    const button = jQuery('.columnsButton', this.element())
    makePopup(button, this.method('generateColumnsPopup'));
    return button
  });
  
  def.method('positionColumnsButton', function() {
    if (this._loaded) {
      const self = this;
      return setTimeout(() => jQuery('.columnsButton', self._element).css('top', self._tableElement.position().top)
      , 1);
    }
  });

  def.method('generateTableHTML', function(html, rows=null, media) {
    if (media == null) { media = 'screen'; }
    html.push('<thead>');
    this.generateHeaderInnerHTML(html, media);
    html.push('</thead><tbody>');
    this.generateBodyInnerHTML(html, rows, media);
    return html.push('</tbody>');
  });
  
  def.method('generateHeaderInnerHTML', function(html, media) {
    if (media == null) { media = 'screen'; }
    html.push('<tr>');
    for (let column of Array.from(this._columns)) {
      if (!column.hidden && (!column.media || (column.media === media))) {
        this.generateColumnHeaderHTML(column, html, media);
      }
    }
    return html.push('</tr>');
  });
  
  def.method('generateColumnHeaderHTML', function(column, html, media) {
    if (media == null) { media = 'screen'; }
    html.push(`<th style="cursor:pointer" onclick="TableView.Instances[${this._id}].setSortColumn(${column.index})">`);
    html.push(this.titleForColumn(column, false));
        
    if ((media === 'screen') && (column === this._sortColumn)) {
      html.push('<span class="sortLabel">');
      if (this._reverseSort) {
        html.push(' &#x2191;'); 
      } else {
        html.push(' &#x2193;');
      }
      html.push('</span>');
    }
    
    return html.push('</th>');
  });
  
  def.method('generateBodyInnerHTML', function(html, rows=null, media) {
    if (media == null) { media = 'screen'; }
    const self = this;
    if (!rows) { rows = this._ordered; }
    return Array.from(rows).map((item) =>
      self.generateRowHTML(item, html, media));
  });
  
  def.method('activateBody', function() {
    const self = this;
    this._tbody = jQuery('tbody', this._tableElement);
    jQuery('tr', this._tbody).each(function(index) {
      return self._rowsByUid[self._ordered[index]._uid] = this;
    });
    return this._list.each(this.method('activateRow'));
  });
  
  def.method('generateRowHTML', function(item, html, media) {
    if (media == null) { media = 'screen'; }
    html.push('<tr data-uid="', item._uid, '">');
    this.generateRowInnerHTML(item, html, media);
    return html.push('</tr>');
  });

  def.method('generateRowInnerHTML', function(item, html, media) {
    if (media == null) { media = 'screen'; }
    return (() => {
      const result = [];
      for (let column of Array.from(this._columns)) {      
        if (!column.hidden && (!column.media || (column.media === media))) {
          html.push('<td>');
          html.push(
            column.html ?
              column.html(item, media)
            :
              this.cellValue(item, column, media)
          );
          result.push(html.push('</td>'));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  });
  
  def.method('activateRow', function(item) {
    const cells = jQuery("td", this._rowsByUid[item._uid]);
    let i = 0;
    return (() => {
      const result = [];
      for (let column of Array.from(this._columns)) {      
        if (!column.hidden && (!column.media || (column.media === 'screen'))) {
          if (column.activate && cells[i]) { column.activate(item, cells[i]); }
          result.push(i++);
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  });
  
  def.method('cellValue', function(item, column, media) {
    if (media == null) { media = 'screen'; }
    if (column.value) {
      return column.value(item, media);
    } else if (column.field) {
      if (item && item.get) {
        return item.get(column.field);
      } else if (item) {
        return item[column.field];
      }
    }
  });
  
  def.method('refreshTable', function() {
    if (this._loaded) {
      this.refreshHeader();
      return this.refreshBody();
    }
  });
  
  def.method('refreshHeader', function() {
    if (this._loaded) {
      const thead = jQuery('thead', this._tableElement);
      const html = [];
      this.generateHeaderInnerHTML(html);
      return thead.html(html.join(''));
    }
  });

  def.method('refreshBody', function() {
    if (this._loaded) {
      const html = [];
      this.generateBodyInnerHTML(html);
      this._tbody.html(html.join(''));
      return this.activateBody();
    }
  });
  
  def.method('refreshRow', function(item) {
    let row;
    if (row = this._rowsByUid[item._uid]) {
      const html = [];
      this.generateRowInnerHTML(item, html);
      jQuery(row).html(html.join(''));
      return this.activateRow(item);
    }
  });
  
  def.method('toggleColumn', function(column) {
    column.hidden = !column.hidden;
    this.saveColumns();        
    this.refreshHeader();
    return this.refreshBody();
  });
      
  def.method('generateColumnsPopup', function() {
    const self = this;
    const a = [];
    for (let column of Array.from(this._columns)) {
      if ((!column.media || (column.media === 'screen')) && !column.fixed) {
        a.push({
          title:      this.titleForColumn(column, true),
          action:     (column => () => self.toggleColumn(column))(column),
          className:  column.hidden ? 'unchecked' : 'checked'
        });
      }
    }
    return a;
  });
  
  // Determines title to use for a column, looking first at specefied title,
  // then into languague definitions matching the column name
  def.method('titleForColumn', function(column, full) {
    if (full && column.fullTitle) {
      return column.fullTitle;
    } else if (full && this._lang && column.name && this._lang[column.name + "Full"]) {
      return this._lang[column.name + "Full"];
    } else if (column.title) {
      return column.title;
    } else if (this._lang && column.name && this._lang[column.name]) {
      return this._lang[column.name];
    }
  });
  
  def.method('listItemAdded', function(list, item) {  
    if (!item._uid) { item._uid = BaseObject.UID++; }
    this._ordered.push(item);

    if (this._loaded) {
      const html = [];
      this.generateRowHTML(item, html);
      this._tbody.append(html.join(''));
      this._rowsByUid[item._uid] = jQuery('tr:last-child', this._tbody);
      this.activateRow(item);
      return Command.once(`sort${this._uid}`, this.method('sort'));
    }
  });
  
  def.method('listItemRemoved', function(list, item) {
    let index, row;
    if ((index = this._ordered.indexOf(item)) != null) {
      this._ordered.splice(index, 1);
    }
    
    if (row = this._rowsByUid[item._uid]) {
      jQuery(row).remove();
      return delete this._rowsByUid[item._uid];
    }
  });
  
  def.method('listItemChanged', function(list, item) {
    if (this._loaded) {
      this.refreshRow(item);
      return Command.once(`sort${this._uid}`, this.method('sort'));
    }
  });
  
  def.method('generatePrintHTML', function(html, options) {
    if (options == null) { options = {}; }
    const rows = this._ordered.slice(0);
    rows.sort(this.sortFunction(options.sortColumn));
    html.push('<table class="tableView">');
    this.generateTableHTML(html, rows, 'print');
    return html.push('</table>');
  });

  def.method('print', function(options) {
    if (options == null) { options = {}; }
    const html = [];
    if (options.heading) { html.push('<h2>', options.heading, '</h2>'); }
    this.generatePrintHTML(html, options);
    return this.helper().print(html.join(''), options);
  });
  
  def.method('persistColumns', function(storage, key) {
    this._persistColumnsStorage = storage;
    this._persistColumnsKey = key;
    return this.loadColumns();
  });
  
  def.method('loadColumns', function() {
    if (!this._persistColumnsStorage || !this._persistColumnsKey) { return; }
    return this._persistColumnsStorage.fetch(this._persistColumnsKey, value => {
      if (value) {
        return (() => {
          const result = [];
          for (let name in value) {
            const hidden = value[name];
            if (this._columnsByName[name]) { result.push(this._columnsByName[name].hidden = hidden); } else {
              result.push(undefined);
            }
          }
          return result;
        })();
      }
    });
  });
  
  def.method('saveColumns', function() {
    if (!this._persistColumnsStorage || !this._persistColumnsKey) { return; }
    const value = {};
    for (let column of Array.from(this._columns)) {
      if (column.name) { value[column.name] = column.hidden; }
    }
    return this._persistColumnsStorage.set(this._persistColumnsKey, value);
  });
  
  def.method('_headerChanged', function(oldValue, newValue) {
    this.super(oldValue, newValue);
    if (this._loaded) { return this.positionColumnsButton(); }
  });
});
