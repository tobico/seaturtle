#require ST/Object
#require ST/Enumerable
#require ST/Inflector
#request ST/Model/Scope
#request ST/Model/Index

ST.class 'Model', ->
  @_byUuid      = {}
  @NotFound     = {}
  @GenerateUUID = Math.uuid || (-> @NextUUID ||= 0; @NextUUID++)
  @Storage      = null
  @Debug        = false
  
  @trigramsFor = (string) ->
    trigrams = []
    string = " #{string} ".toLowerCase().replace(/\s+/g, '  ')
    for i in [0..(string.length - 3)]
      trigrams.push string.substring(i, i + 3)
    trigrams
  
  @classMethod 'fetch', (uuid, yield) ->
    self = this
    
    if ST.Model._byUuid[uuid]
      yield ST.Model._byUuid[uuid] if yield
    else if @FETCH_URL
      $.ajax {
        url:      @FETCH_URL.replace('?', uuid)
        type:     'get'
        data:     @FETCH_DATA || {}
        success:  (data) ->
          model = self.createWithData data
          yield model if yield
      }
    else
      ST.error "No find URL for model: #{@_name}"
  
  @classDelegate 'where', 'scoped'
  @classDelegate 'order', 'scoped'
  @classDelegate 'each',  'scoped'
  @classDelegate 'first', 'scoped'
  
  @classMethod 'scoped', ->
    ST.Model.Scope.createWithModel this
  
  @classMethod 'find', (uuid) ->
    ST.Model._byUuid[uuid]
  
  @classMethod 'load', (data) ->
    self = this
    if data instanceof Array
      for row in data
        @load row
    else
      return unless data && data.uuid
      return if ST.Model._byUuid[data.uuid]
      @createWithData data
  
  @classMethod 'index', (attribute) ->
    @_indexes ||= {}
    @_indexes[attribute] ||= ST.Model.Index.createWithModelAttribute(this, attribute)
    
  @classMethod 'changes', ->
    ST.Model._changes || []
  
  @classMethod 'saveToServer', (url, async, extraData) ->
    return if ST.Model.Saving
    return unless ST.Model._changes && ST.Model._changes.length
    
    ST.Model.Saving = true
    
    data = { data: JSON.stringify updatedData }
    $.extend data, extraData if extraData
    
    STModel.SaveStarted() if STModel.SaveStarted
    
    $.ajax {
      url:      url
      type:     'post'
      async:    if async? then async; else true
      data:     data,
      success:  (data) ->
        STModel.SaveFinished() if STModel.SaveFinished
        
        if data.status && data.status == 'Access Denied'
          STModel.AccessDeniedHandler() if STModel.AccessDeniedHandler
        
        for type in ['created', 'updated', 'deleted']
          if data[type] && data[type] instanceof Array
            for uuid in data[type]
              object = ST.Model.find uuid
              object.set(type, false).persist() if object
             
      complete: ->
        ST.Model.Saving = false
    }
  
  @initializer (options) ->
    @initWithData {}, options
    this
  
  # Initializes a new model, and loads the supplied attribute data, if any
  @initializer 'withData', (data, options) ->
    self = this
    
    ST.Object.prototype.init.call this

    @uuid data.uuid || ST.Model.GenerateUUID()
    @_creating = true
    @_attributes = {}
    for attribute, details of @_class.Attributes
      if @_class.Attributes.hasOwnProperty(attribute) && !details.virtual
        @[attribute](
          if data[attribute]?
            data[attribute]
          else
            details.default
        )
    
    if @_class._manyBinds
      for binding in @_class._manyBinds
        @get(binding.assoc).bind binding.from, self, binding.to
    
    if @_class._searchAttributes
      for attribute in @_class._searchAttributes
        @indexForKeyword @_attributes[attribute]

    @_creating = false
    @_class.trigger 'itemAdded', this
  
  # Creates a new object from model data. If the data includes a 
  # property, as with data genereated by #objectify, the specified model
  # will be used instead of the model createWithData was called on.
  @classMethod 'createWithData', (data, options) ->
    # If data is being sent to the wrong model, transfer to correct model
    if data.model && data.model != @_name
      if (@_namespace[data.model])
        @_namespace[data.model].createWithData data, options
      else
        null
    # If object with uuid already exists, update object and return it
    else if data.uuid && ST.Model._byUuid[data.uuid]
      object = ST.Model._byUuid[data.uuid]
      attributes = object._class.Attributes
      for attribute, details of attributes
        if attributes.hasOwnProperty attribute
          object.set attribute, data[attribute] if data[attribute]?
      object
    # Otherwise, create a new object
    else
      object = new this
      object.initWithData data, options
      object
  
  @property 'uuid'
  
  @method 'setUuid', (newUuid) ->
    unless @_uuid    
      # Insert object in global index
      ST.Model._byUuid[newUuid] = this
    
      # Insert object in model-specific index
      @_class._byUuid ||= {}
      @_class._byUuid[newUuid] = this
    
      @_uuid = newUuid
  
  @method 'matches', (conditions) ->
    if @_attributes
      for condition in conditions
        return false unless condition.test @_attributes[condition.attribute]
      true
    else
      false
  
  @method '_changed', (member, oldValue, newValue) ->
    @super member, oldValue, newValue
    @_class.trigger 'itemChanged', this
    if @_class._searchAttributes && @_class._searchAttributes.indexOf(member) >= 0
      @deindexForKeyword oldValue
      @indexForKeyword newValue
    
    ST.Model._changes ||= []
    ST.Model._changes.push {
      uuid:       ST.Model.GenerateUUID()
      model:      @_class._name
      type:       'update'
      objectUuid: @_uuid
      attribute:  member
      oldValue:   oldValue
      newValue:   newValue
    }
  
  # Returns saveable object containing model data.
  @method 'serialize', ->
    output = {
      model:  @_class._name
      uuid:   @uuid()
    }
    for attribute of @_attributes
      if @_attributes.hasOwnProperty attribute
        value = @_attributes[attribute]
        value = String(value) if value instanceof Date
        output[attribute] = value
    JSON.stringify output
  
  # Saves model data and saved status in Storage for persistance.
  @method 'persist', ->
    if ST.Model.Storage
      ST.Model.Storage.set @uuid(), @serialize()
  
  # Removes all local data for model.
  @method 'forget', ->
    # Remove from global index
    delete ST.Model._byUuid[@_uuid]
    
    # Remove from model index
    delete @_class._byUuid[@_uuid]
    
    # Remove from attribute indexes
    if @_class._indexes
      for attribute, index of @_class._indexes
        index.remove @_attributes[attribute], this if index.remove
    
    # Remove from persistant storage
    ST.Model.Storage.remove @_uuid if ST.Model.Storage
    
    @_class.trigger 'itemRemoved', this

  # Marks model as destroyed, destroy to be propagated to server when 
  # possible.
  @method 'destroy', ->
    ST.Model._changes ||= []
    ST.Model._changes.push {
      uuid:       ST.Model.GenerateUUID()
      model:      @_class._name
      type:       'destroy'
      objectUuid: @_uuid
    }
    @forget()
  
  @classMethod 'convertValueToType', (value, type) ->
    switch type
      when 'string'
        String value
      when 'real'
        Number value
      when 'integer'
        Math.round Number(value)
      when 'bool'
        !!value
      when 'datetime'
        date = new Date(value)
        if isNaN(date.getTime()) then null else date
      else
        value

  @classMethod 'attribute', (name, type, defaultValue) ->
    ucName = ST.ucFirst name
    
    @Attributes ||= {}
    @Attributes[name] = {
      default:  defaultValue,
      type:     type,
      virtual:  false
    }
    
    @method "set#{ucName}", (rawValue) ->
      oldValue = @_attributes[name]
  
      # Convert new value to correct type
      details = @_class.Attributes[name]
      newValue = ST.Model.convertValueToType rawValue, details.type
      
      # Set new value
      @_attributes[name] = newValue
  
      # Update index
      if @_class._indexes
        if index = @_class._indexes[name]
          index.remove  oldValue, this
          index.add     newValue, this
  
      # Trigger changed event
      unless @_creating
        @_changed name, oldValue, newValue if @_changed
        @trigger 'changed', name, oldValue, newValue
    
    @method "get#{ucName}", -> @_attributes[name]
    
    @accessor name

    @[name] = {
      equals: (value) ->
        {
          type:       'equals'
          attribute:  name
          value:      value
          test:       (test) -> test == value
        }
      lessThan: (value) ->
        {
          attribute:  name
          value:      value
          test:       (test) -> test < value
        }
      lessThanOrEquals: (value) ->
        {
          attribute:  name
          value:      value
          test:       (test) -> test <= value
        }
      greaterThan: (value) ->
        {
          attribute:  name
          value:      value
          test:       (test) -> test > value
        }
      greaterThanOrEquals: (value) ->
        {
          attribute:  name
          value:      value
          test:       (test) -> test >= value
        }
    }
  
  # In the following methods, “def” stands for “default”
  @classMethod 'string', (name, def) -> @attribute name, 'string', def
  @classMethod 'integer', (name, def) -> @attribute name, 'integer', def
  @classMethod 'real', (name, def) -> @attribute name, 'real', def
  @classMethod 'bool', (name, def) -> @attribute name, 'bool', def
  @classMethod 'datetime', (name, def) -> @attribute name, 'datetime', def
  @classMethod 'enum', (name, def, values) ->
    @attribute name, 'enum', def
    @Attributes[name].values = values
  
  @classMethod 'virtual', (name, type, defaultValue) ->
    @accessor name
    @Attributes ||= {}
    @Attributes[name] = {
      default:  defaultValue,
      type:     type,
      virtual:  true
    }
  
  @classMethod 'belongsTo', (name, assocModel, options={}) ->
    @string "#{name}Uuid"
    
    ucName = ST.ucFirst name
    
    @method "get#{ucName}", ->
      uuid = @["#{name}Uuid"]()
      ST.Model._byUuid[uuid] || null
    
    @method "set#{ucName}", (value) ->
      ST.error 'Invalid object specified for association' if value && value._class._name != assocModel
      @["#{name}Uuid"](value && value.uuid())
    
    @virtual(name, 'belongsTo', null).model = assocModel
  
    @[name] = {
      is: (value) ->
        uuid = value && value.uuid()
        {
          type:       'equals'
          attribute:  name + "Uuid"
          value:      uuid
          test:       (test) -> test == uuid
        }
    }

    if options.bind
      setUuidName = "set#{ucName}Uuid"
      oldSet = @prototype[setUuidName]
      @method setUuidName, (newValue) ->
        oldValue = @_attributes[name]
        unless oldValue == newValue
          if oldValue && oldValue.unbind
            for key of options.bind
              oldValue.unbind key, this
          oldSet.call this, newValue
          if newValue && newValue.bind
            for key of options.bind
              oldValue.bind key, this, options.bind[key]

  @classMethod 'hasMany', (name, assocModel, foreign=null, binds={}) ->
    # One-to-many assocation through a Model and foreign key
    @method name, ->
      unless this["_#{name}"]
        model = @_class._namespace.class assocModel
        this["_#{name}"] = model.where(model["#{foreign}Uuid"].equals(@uuid()))
      this["_#{name}"]
    
    for key of binds
      if binds.hasOwnProperty key
        @_manyBinds ||= []
        @_manyBinds.push {
          assoc:  name
          from:   key
          to:     binds[key]
        }
  
  @classMethod 'searchesOn', (attributes...) ->
    @_searchAttributes = attributes
    @_trigrams = {}
  
  @classMethod 'search', (keywords) ->
    trigrams = ST.Model.trigramsFor(keywords)
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
    matches
  
  @method 'indexForKeyword', (keyword) ->
    trigrams = ST.Model.trigramsFor keyword
    for trigram in trigrams
      @_class._trigrams[trigram] ||= {}
      @_class._trigrams[trigram][@_uuid] ||= 0
      @_class._trigrams[trigram][@_uuid]++ 

  @method 'deindexForKeyword', (keyword) ->
    trigrams = ST.Model.trigramsFor keyword
    for trigram in trigrams      
      if (@_class._trigrams[trigram][@_uuid] -= 1) == 0
        delete @_class._trigrams[trigram][@_uuid]
  
  @classMethod 'setStorage', (storage) ->
    ST.Model.Storage = storage;
    
    if storage
      # Save any existing models to new storage
      for object in ST.Model._byUuid
        object.persist()
  
      # Load any unloaded saved models from storage
      storage.each (key, value) ->
        if value && value.model && window[value.model] && !STModel.byUuid[key]
          model = ST.Model.createWithData value
          model.created = value._created if value._created?
          model.updated = value._updated if value._updated?
          model.deleted = value._deleted if value._deleted?
          model.approved = value._approved if value._approved?