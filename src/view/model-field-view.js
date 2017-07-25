import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { FieldView } from './field-view'
import { BaseModel } from '../model/base-model'
import { trim } from '../util/trim'
import { BaseView } from './base-view'

export const ModelFieldView = makeClass('ModelFieldView', FieldView, (def) => {
  // Mappings for event key code to result index
  def.KEY_CODES = { 49:0, 50:1, 51:2, 52:3, 53:4, 54:5, 55:6, 56:7, 57:8, 48:9, 97:0, 98:1, 99:2, 100:3, 101:4, 102:5, 103:6, 104:7, 105:8, 96:9 };
  
  def.RESULT_LIMIT = 5;
  
  // Mappings from result index to label for key
  def.KEY_LABELS = '123456789'.split('');
  
  def.initializer('withModel', function(model) {
    this.init();
    this._model = model;
    this._scope = null;
    this._text = '';
    this._placeholder = '';
    this._searching = false;
    this._searchValue = '';
    this._results = null;
    this._canCreate = false;
    this._createLabel = null;
    this._focused = false;
    return this._searchRemotelyAt = null;
  });
  
  def.initializer('withScope', function(scope) {
    this.initWithModel(scope.model());
    return this._scope = scope;
  });
  
  def.property('searching');
  def.property('placeholder');
  def.property('results');
  def.property('selectedResult');
  def.property('acceptsNull');
  def.property('resultListElement');
  def.property('searchRemotelyAt');
  
  def.method('allowCreateWithLabel', function(label) {
    this._canCreate = true;
    return this._createLabel = label;
  });
  
  def.method('convertValue', function(value) {
    if (value instanceof BaseModel) {
      return value;
    } else {
      return null;
    }
  });
  
  def.method('inputHTML', () => '<input type="text" class="text" />');
  
  def.method('setInputValue', function(value) {
    if (value) {
      this._text = trim(value.toFieldText());
      this._inputElement.val(this._text);
      this._inputElement.removeClass('placeholder');
    } else {
      this._text = '';
      this._inputElement.val(this._placeholder);
      this._inputElement.addClass('placeholder');
    }
  });
  
  def.method('render', function() {
    this.super();
    this._inputElement.keydown(this.method('inputKeyDown'));
    this._inputElement.focus(this.method('inputFocus'));
    this._inputElement.blur(this.method('inputBlur'));
    this._inputElement.attr({
      'autocomplete': 'off',
      'autocorrect':  'off'
    });
    this._inputElement[0]._view = this
    
    this._resultListElement = jQuery('<div class="ModelFieldViewResults"></div>');
    this._resultListElement.hide();
    this._resultListElement.mouseout(() => {
      if (!this._hiding) { return this.selectedResult(-1); }
    });
    jQuery(document.body).append(this._resultListElement);
  });
  
  def.method('inputFocus', function() {
    this._focused = true;
    if (this._value) {
      this._inputElement.select();
    } else {
      this._inputElement.val('');
      this._inputElement.removeClass('placeholder');
    }
    
    if (!this._value || (this._text !== this._value.toFieldText())) {
      this.performSearch(this._text);
    }
    
    return this.trigger('focused');
  });
  
  def.method('inputBlur', function() {
    this._hiding = true;
    if (this._text === '') {
      this.value(null);
      this.trigger('valueChosen', null);
      this.inputValue(null);
    } else if (this._results && (this._selectedResult >= 0)) {
      this.chooseResult(this._results[this._selectedResult]);
    } else {
      this.inputValue(this._value);
    }
    
    this.hideResultList();
    this._hiding = false;
    this._focused = false;
    return this.trigger('blurred');
  });
  
  def.method('inputChanged', function() {
    const value = trim(this._inputElement.val());
    if (this._text !== value) {
      this._text = value;
      if (this._focused) { return this.performSearch(value); }
    }
  });
  
  def.method('_selectedResultChanged', function(oldValue, newValue) {
    if (this._resultListElement) {
      const rows = jQuery('tr', this._resultListElement);
      if (oldValue >= 0) { rows.eq(oldValue).removeClass('selected'); }
      if (newValue >= 0) { return rows.eq(newValue).addClass('selected'); }
    }
  });
  
  def.method('inputKeyDown', function(event) {
    switch (event.which) {
      case BaseView.VK_ESCAPE:
        this.blur();
        event.stopPropagation();
        return event.preventDefault();
      case BaseView.VK_UP:
        if (this._results) {
          if (this._selectedResult > 0) {
            this.selectedResult(this._selectedResult - 1);
          } else {
            this.selectedResult(this._results.length - 1);
          }
        }
        event.stopPropagation();
        return event.preventDefault();
      case BaseView.VK_DOWN:
        if (this._results) {
          if (this._selectedResult < (this._results.length - 1)) {
            this.selectedResult(this._selectedResult + 1);
          } else {
            this.selectedResult(0);
          }
        }
        event.stopPropagation();
        return event.preventDefault();
      case BaseView.VK_RETURN:
        if ((this._selectedResult >= 0) || (this.text === '')) { this.blur(); }
        event.stopPropagation();
        return event.preventDefault();
      case 48: case 190: case 110: // 0
        if (this._canCreate) {
          this.selectedResult(this._results.length - 1);
          this.blur();
          event.stopPropagation();
          return event.preventDefault();
        }
        break;
      case BaseView.VK_TAB:
        if (this._searching || this._results) {
          event.stopPropagation();
          return event.preventDefault();
        }
        break;
      default:
        if (ModelFieldView.KEY_CODES[event.which] != null) {
          const n = ModelFieldView.KEY_CODES[event.which];
          if (this._results && this._results[n]) {
            this.selectedResult(n);
            this.blur();
            event.stopPropagation();
            return event.preventDefault();
          }
        }
    }
  });
  
  def.method('performSearch', function(search) {
    const self = this; 
    if (this._searching) {
      return this._searchForNext = search;
    } else if (search.length) {
      const remote = !this._scope && this._model.searchRemotely(search, {url: this._searchRemotelyAt}, function(results) {
        self._searching = false;
        if (!self._focused) {
          if (self._resultListElement) { self.hideResultList(); }
        } else if (self._searchForNext != null) {
          self.performSearch(self._searchForNext);
        } else {
          self.showResults(results);
        }
        return self._searchForNext = null;
      });
      
      if (remote) {
        this._searching = true;
        return this.showSearchProgress();
      } else {
        return this.showResults((this._scope || this._model).search(search));
      }
    } else {
      this._results = null;
      return this.hideResultList();
    }
  });
  
  def.method('showResultList', function() {
    if (!this._resultListVisible) {
      const offset = this._inputElement.offset();
      this._resultListElement.css('left', offset.left);
      this._resultListElement.css('top', offset.top + this._inputElement.outerHeight());
      this._resultListElement.show();
      return this._resultListVisible = true;
    }
  });
  
  def.method('hideResultList', function() {
    if (this._resultListVisible) {
      this._resultListElement.hide();
      return this._resultListVisible = false;
    }
  });
  
  def.method('showSearchProgress', function() {
    this._resultListElement.html('<table><tr><td>Searching...</td></tr></table>');
    return this.showResultList();
  });
  
  def.method('showResults', function(results) {
    const self = this;
    
    this._results = results;
    if (this._results || this._canCreate) {
      if (this._results.length > ModelFieldView.RESULT_LIMIT) {
        this._results.splice(ModelFieldView.RESULT_LIMIT);
      }
      
      const html = ['<table><tbody>'];
      let maxCols = 1;
      for (let i = 0; i < this._results.length; i++) {
        const result = this._results[i];
        html.push(`<tr style="cursor: default" onmouseover="selectResult(${i})"><td class="hotkey">`);
        html.push(ModelFieldView.KEY_LABELS[i]);
        html.push('</td><td>');
        const cols = result[0].toListItem();
        if (cols.length > maxCols) { maxCols = cols.length; }
        html.push(cols.join('</td><td>'));
        html.push('</td></tr>');
      }
      
      if (this._canCreate) {
        html.push('<tr style="cursor: default" onmouseover="selectResult(', results.length, ')"><td class="hotkey">0</td><td colspan="', maxCols, '">Create new ', this._model._name.toLowerCase());
        html.push(' ', this._createLabel.replace('$1', this._text));
        results.push('new');
      }
      
      html.push('</tbody></table>');
      
      this._resultListElement.html(html.join(''));
      
      window.selectResult = index => self.selectedResult(index);
      
      this.selectedResult(-1);
      
      return this.showResultList();
    } else {
      return this.hideResultList();
    }
  });
  
  def.method('chooseResult', function(result) {
    if (result === 'new') {
      this.trigger('create', this._text);
    } else if (result && result[0]) {
      this.value(result[0]);
      this.trigger('valueChosen', result[0]);
    }
    return this._results = null;
  });

  // Test helpers

  def.method('_searchText', function(text) {
    this.inputFocus()
    this._inputElement[0].value = text
    this.inputChanged()
  })
  
  def.method('_chooseByText', function(text) {
    this.blur();
    this.hideResultList();
    this._focused = false;
    this._searchNext = null;
    if (text === 'new') {
      this.chooseResult('new');
    } else if (this._results) {
      this._results.forEach(result => {
        if (result[0].toFieldText().indexOf(text) >= 0) { this.chooseResult(result); }
      })
    }
  });
});
