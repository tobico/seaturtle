#= require ST

ST.module 'Model', ->
  # Searchable module enables local trigram-based and remote searching for a
  # class. The only requirements are that the class has at least one string
  # property to index.
  @module 'Searchable', ->
    # Breaks a string down into trigrams, and returns an array. All spacing
    # is replaces with double space ‘  ’ characters, so the first and last
    # letters of a word will always get their own trigrams.
    @trigramsFor = (string) ->
      trigrams = []
      string = " #{string} ".toLowerCase().replace(/\s+/g, '  ')
      for i in [0..(string.length - 3)]
        trigrams.push string.substring(i, i + 3)
      trigrams
    
    # Enables trigram search for this class, indexed on the given properties
    @classMethod 'searchesOn', (properties...) ->
      @_searchProperties = properties
      @_trigrams = {}
      
      # Add change handler for each attribute to ensure trigram indexes are
      # always correct and up to date 
      for property in properties
        self = this
        do (property) ->
          self.method "_#{property}Changed", (oldValue, newValue) ->
            @super oldValue, newValue if @super
            @indexForKeyword    newValue
            @deindexForKeyword  oldValue
    
    # Performs a search for given keyword(s), and returns the results as an
    # array.
    #
    # Set the “filter” option to provide a callback function to filter
    # results, only results where the function returns true will be included.
    #
    # Set the “limit” option to specify the maximum number of results to
    # return. Default: 10
    @classMethod 'search', (keywords, options={}) ->
      if @_trigrams
        options.limit ||= 10
        trigrams = ST.Model.Searchable.trigramsFor keywords
        uuids = {}
        for trigram in trigrams
          if @_trigrams[trigram]
            for uuid, count of @_trigrams[trigram]
              if @_trigrams[trigram].hasOwnProperty uuid
                uuids[uuid] ||= 0
                uuids[uuid]++
        matches = []
        for uuid, score of uuids
          if uuids.hasOwnProperty uuid
            matches.push [ST.Model._byUuid[uuid], score]
        matches.sort (a, b) ->
          if a[1] < b[1]
            1
          else if a[1] > b[1]
            -1
          else
            0
        if options.filter
          found = []
          for match in matches
            if options.filter match[0]
              found.push match
              break if found.length >= options.limit
          found
        else
          matches
      else
        []

    # Adds this object to class trigram search index for the given keyword(s)
    # If keyword contains any one trigram more than once, it will be given
    # and extra point for each additional occurence
    @method 'indexForKeyword', (keyword) ->
      trigrams = ST.Model.Searchable.trigramsFor keyword
      for trigram in trigrams
        @_class._trigrams[trigram] ||= {}
        @_class._trigrams[trigram][@_uuid] ||= 0
        @_class._trigrams[trigram][@_uuid]++
      null

    # Removes this object from class trigram search index for the given 
    # keyword(s). This should exactly reverse the effect of calling
    # #indexForKeyword for the same keyword.
    @method 'deindexForKeyword', (keyword) ->
      trigrams = ST.Model.Searchable.trigramsFor keyword
      for trigram in trigrams
        if @_class._trigrams[trigram]
          if (@_class._trigrams[trigram][@_uuid] -= 1) == 0
            delete @_class._trigrams[trigram][@_uuid]
      null
    
    # Enables AJAX-based remote search using the given URL.
    # The URL is passed search keywords as a GET parameter named “query”.
    # It should return an array of serialized model definitions.
    # All returned models will be loaded and returned as an array.
    #
    # If related models are required to display the searched models, you can
    # include them in the same array, and they will be loaded too, but not
    # returned in the results.
    @classMethod 'searchesRemotelyAt', (url) ->
      @_remoteSearchURL = url
    
    # Performs a remote search for the given keyword, and calls the callback
    # function with an array of results when the search is complete.
    #
    # Specify the “url” option to override the default class search URL.
    @classMethod 'searchRemotely', (keyword, options={}, callback) ->
      url = options.url || @_remoteSearchURL
      if url
        self = this
        $.ajax {
          url:      url
          method:   'get'
          data:     {query: keyword}
          success:  (data) ->
            results = []
            for itemData in data
              item = ST.Model.Base.createWithData itemData, {loaded: true}
              results.push [item] if item instanceof self
            callback results
          error:    ->
            callback []
        }
        true
      else
        false