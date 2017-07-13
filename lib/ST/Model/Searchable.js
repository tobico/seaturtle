/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST

ST.module('Model', function() {
  // Searchable module enables local trigram-based and remote searching for a
  // class. The only requirements are that the class has at least one string
  // property to index.
  return this.module('Searchable', function() {
    // Breaks a string down into trigrams, and returns an array. All spacing
    // is replaces with double space ‘  ’ characters, so the first and last
    // letters of a word will always get their own trigrams.
    this.trigramsFor = function(string) {
      const trigrams = [];
      string = ` ${string} `.toLowerCase().replace(/\s+/g, '  ');
      for (let i = 0, end = string.length - 3, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
        trigrams.push(string.substring(i, i + 3));
      }
      return trigrams;
    };
    
    // Enables trigram search for this class, indexed on the given properties
    this.classMethod('searchesOn', function(...properties) {
      this._searchProperties = properties;
      this._trigrams = {};
      
      // Add change handler for each attribute to ensure trigram indexes are
      // always correct and up to date 
      return (() => {
        const result = [];
        for (let property of Array.from(properties)) {
          var self = this;
          result.push((property =>
            self.method(`_${property}Changed`, function(oldValue, newValue) {
              if (this.super) { this.super(oldValue, newValue); }
              this.indexForKeyword(newValue);
              return this.deindexForKeyword(oldValue);
            })
          )(property));
        }
        return result;
      })();
    });
    
    // Performs a search for given keyword(s), and returns the results as an
    // array.
    //
    // Set the “filter” option to provide a callback function to filter
    // results, only results where the function returns true will be included.
    //
    // Set the “limit” option to specify the maximum number of results to
    // return. Default: 10
    this.classMethod('search', function(keywords, options) {
      if (options == null) { options = {}; }
      if (this._trigrams) {
        let uuid;
        if (!options.limit) { options.limit = 10; }
        const trigrams = ST.Model.Searchable.trigramsFor(keywords);
        const uuids = {};
        for (let trigram of Array.from(trigrams)) {
          if (this._trigrams[trigram]) {
            for (uuid in this._trigrams[trigram]) {
              const count = this._trigrams[trigram][uuid];
              if (this._trigrams[trigram].hasOwnProperty(uuid)) {
                if (!uuids[uuid]) { uuids[uuid] = 0; }
                uuids[uuid]++;
              }
            }
          }
        }
        const matches = [];
        for (uuid in uuids) {
          const score = uuids[uuid];
          if (uuids.hasOwnProperty(uuid)) {
            matches.push([ST.Model._byUuid[uuid], score]);
          }
        }
        matches.sort(function(a, b) {
          if (a[1] < b[1]) {
            return 1;
          } else if (a[1] > b[1]) {
            return -1;
          } else {
            return 0;
          }
        });
        if (options.filter) {
          const found = [];
          for (let match of Array.from(matches)) {
            if (options.filter(match[0])) {
              found.push(match);
              if (found.length >= options.limit) { break; }
            }
          }
          return found;
        } else {
          return matches;
        }
      } else {
        return [];
      }
  });

    // Adds this object to class trigram search index for the given keyword(s)
    // If keyword contains any one trigram more than once, it will be given
    // and extra point for each additional occurence
    this.method('indexForKeyword', function(keyword) {
      const trigrams = ST.Model.Searchable.trigramsFor(keyword);
      for (let trigram of Array.from(trigrams)) {
        if (!this._class._trigrams[trigram]) { this._class._trigrams[trigram] = {}; }
        if (!this._class._trigrams[trigram][this._uuid]) { this._class._trigrams[trigram][this._uuid] = 0; }
        this._class._trigrams[trigram][this._uuid]++;
      }
      return null;
    });

    // Removes this object from class trigram search index for the given 
    // keyword(s). This should exactly reverse the effect of calling
    // #indexForKeyword for the same keyword.
    this.method('deindexForKeyword', function(keyword) {
      const trigrams = ST.Model.Searchable.trigramsFor(keyword);
      for (let trigram of Array.from(trigrams)) {
        if (this._class._trigrams[trigram]) {
          if ((this._class._trigrams[trigram][this._uuid] -= 1) === 0) {
            delete this._class._trigrams[trigram][this._uuid];
          }
        }
      }
      return null;
    });
    
    // Enables AJAX-based remote search using the given URL.
    // The URL is passed search keywords as a GET parameter named “query”.
    // It should return an array of serialized model definitions.
    // All returned models will be loaded and returned as an array.
    //
    // If related models are required to display the searched models, you can
    // include them in the same array, and they will be loaded too, but not
    // returned in the results.
    this.classMethod('searchesRemotelyAt', function(url) {
      return this._remoteSearchURL = url;
    });
    
    // Performs a remote search for the given keyword, and calls the callback
    // function with an array of results when the search is complete.
    //
    // Specify the “url” option to override the default class search URL.
    return this.classMethod('searchRemotely', function(keyword, options, callback) {
      if (options == null) { options = {}; }
      const url = options.url || this._remoteSearchURL;
      if (url) {
        const self = this;
        $.ajax({
          url,
          method:   'get',
          data:     {query: keyword},
          success(data) {
            const results = [];
            for (let itemData of Array.from(data)) {
              const item = ST.Model.Base.createWithData(itemData, {loaded: true});
              if (item instanceof self) { results.push([item]); }
            }
            return callback(results);
          },
          error() {
            return callback([]);
          }
        });
        return true;
      } else {
        return false;
      }
    });
  });
});