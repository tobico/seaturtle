import jQuery from 'jquery'

import { makeClass } from '../core/make-class'
import { BaseObject } from '../core/base-object'
import { Model } from './model'

export const ModelSearcher = makeClass('ModelSearcher', BaseObject, (def) => {
  def.initializer('withModelUrl', function(model, url, labelField) {
    this.init();

    this.model = model;
    this.url = url;
    this.labelField = labelField || 'label';
    this.async = true;
    this.split = true;
    this.minLength = 3;
    this.cacheMinutes = 2;
    this.cache = {};
    if (typeof window !== 'undefined') {
      window.c = this.cache;
    }
  });

  def.property('minLength');

  def.method('search', function(term) {
    const self = this;

    this.searching = true;

    // Convert term to lowercase to compare
    const lcTerm = term.toLowerCase();

    // Expire cache
    const now = new Date;
    if (this.cache[lcTerm] && (this.cache[lcTerm].expires <= now)) { delete this.cache[lcTerm]; }

    if (term.length < this.minLength) {
      return this.clearResults();
    } else if (this.cache[lcTerm]) {
      return this.setResults(this.cache[lcTerm].results);
    } else {
      return jQuery.ajax({
        url:      this.url,
        method:   'get',
        dataType: 'json',
        data:     {q: term},
        success(data) { return self.succeeded(term, data); },
        error:    this.methodFn('failed')
      });
    }
  });

  def.method('succeeded', function(term, data) {
    const self = this;

    const results = [];
    if (data && data.length) {
      for (let row of Array.from(data)) {
        // Load model data
        Model.createWithData(row, {temporary: true});

        // Don't add object to results list if it's for another model
        if (row._model !== this.model._name) { return; }

        row.model = Model.Index[row.uuid];
        row.label = row.model.get(this.labelField);

        results.push(row);
      }
    }

    // Save result in cache
    this.cache[term.toLowerCase()] = {
        results,
        expires: this.cacheMinutes.minutes().fromNow()
    };

    return this.setResults(results);
  });

  def.method('failed', function() {
    return this.setResults([]);
  });
});
