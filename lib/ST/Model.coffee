#require ST/Object
#require ST/Enumerable

ST.class 'Model', ->  
  @_byUuid       = {}
  @NotFound     = {}
  @GenerateUUID = Math.uuid || (-> null)
  @Storage      = null
  @Debug        = false
  
  @classMethod 'fetch', (uuid, yield) ->
    self = this
            
    if STModel._byUuid[uuid]
      yield STModel._byUuid[uuid]
    else if @FindUrl
      $.ajax {
        url:      @FindUrl.replace('?', uuid)
        type:     'get'
        data:     @FindData || {}
        success:  (data) ->
          model = ST.Model.createWithData data
          yield model
      }
    else
      ST.error "No find URL for model: #{@_name}"
      
  @classDelegate 'where', 'scoped'
  @classDelegate 'order', 'scoped'
  @classDelegate 'each',  'scoped'
  
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
      @createWithObject data
  
  @classMethod 'buildIndex', (attribute) ->
    indexName = "Index#{ST.ucFirst attribute}"
    return if @[indexName]
    
    index = {}
    for uuid of @_byUuid
      object = @_byUuid[uuid]
      value = object.attributes[attribute]
      index[value] ||= STList.create()
      index[value].add object
    @[indexName] = index
  
  @classMethod 'getValueIndex', (attribute, value) ->
    indexName = "Index#{ST.ucFirst attribute}"
    @buildIndex attribute unless @[indexName]
    
    index = @[indexName];
    index[value] ||= STList.create()
    index[value]
  
  @classMethod 'getUpdatedModelData', ->
    data = {
      created: []
      updated: []
      deleted: []
    }
    for uuid of @_byUuid
      model = @_byUuid[uuid]
      continue if model._class.ReadOnly
      if model.created && model.approved
        data.created.push model.objectify()
      else if model.updated && model.approved
        data.updated.push model.objectify()
      else if model.deleted
        data.deleted.push {
          '_model':   model._class._name
          uuid:       model.getUuid()
        }
    data.created.sort ST.makeSortFn('uuid')
    data
  
  @classMethod 'saveToServer', (url, async, extraData) ->
    return if ST.Model.Saving
    
    updatedData = @getUpdatedModelData()
    
    return null if updatedData.created.length == 0 && updatedData.updated.length == 0 && updatedData.deleted.length == 0
    
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
  
  # Initializes a new model, and loads the supplied attribute data, if any
  @initializer 'withData', (data, options) ->
    self = this
    
    ST.Object.prototype.init.call this
    @approved = true
    @created = !data['uuid']
    @deleted = false
    @uuid data['uuid'] || ST.Model.GenerateUUID()
    @attributes = {}
    for attribute of @_class.Attributes
      if data[attribute]?
        @set attribute, data[attribute]
      else
        defaultValue = @_class.Attributes[attribute]
        if typeof defaultValue == 'function'
          @set attribute, new defaultValue()
        else
          @set attribute, defaultValue
    if @_class.ManyMany
      @_class.ManyMany.each (key) ->
        fullKey = "#{key}Uuids"
        self.attributes[fullKey] = []
        self.attributes[fullKey].append data[fullKey] if data[fullKey]
    if @_class.ManyBinds
      @_class.ManyBinds.each (binding) ->
        self.get(binding.assoc).bind(binding.from, self, binding.to);

    @updated = false
    @uuid null
    @persists = !(options && options.temporary)
    @persist()
  
  # Creates a new object from model data. If the data includes a _model
  # property, as with data genereated by #objectify, the specified model
  # will be used instead of the model createWithData was called on.
  @classMethod 'createWithData', (data, options) ->
    # If data is being sent to the wrong model, transfer to correct model
    if data._model && data._model != @_name
      if (window[data._model])
        window[data._model].createWithData data, options
      else
        null
    # If object with uuid already exists, update object and return it
    else if data.uuid && ST.Model._byUuid[data.uuid]
      object = STModel._byUuid[data.uuid]
      object.persists = true unless options && options.temporary
      for attribute of object.attributes
        object.set attribute, data[attribute] if data[attribute]?
      object
    # Otherwise, create a new object
    else
      (new this).initWithData data, options
  
  @property 'uuid'
  
  # These properties specify what changes have been made locally and need
  # to be synchronized to the server.
  #
  # Newly created objects will only be saved if they are marked as
  # approved.
  @property 'created'
  @property 'updated'
  @property 'deleted'
  @property 'approved'
  
  # Makes a new uuid for object.
  @method 'resetId', ->
    @_id = null
    @_uuid = STModel.GenerateUUID()
  
  @method 'setUuid', (newUuid) ->
    return if newUuid == @uuid
    
    # Insert object in global index
    delete ST.Model._byUuid[@uuid]
    ST.Model._byUuid[newUuid] = this
    
    # Insert object in model-specific index
    @_class._byUuid ||= {}
    index = @_class._byUuid
    delete index[@uuid] if index[@uuid]
    index[newUuid] = this
    
    @_uuid = newUuid
  
  @method 'matches', (conditions) ->
    if @attributes
      for key of conditions
        if conditions[key] instanceof Function
          return false unless conditions[key](@attributes[key])
        else
          return false unless @attributes[key] == conditions[key]
      true
    else
      false

  # Returns (and creates if needed) a STList to contain objects from
  # a corresponsing one-to-many relationship using a plain array of UUIDs.
  # 
  # When list is created, triggers are bounds so that items added or
  # removed from the list are reflected in the UUIDs array.
  @method 'getManyList', (member) ->
    # Create list if it doesn't already exist
    unless this[member]
      s = ST.singularize member
  
      # Create a new list, with bindings for itemAdded and itemRemoved
      this[member] = ST.List.create()
      this[member].bind 'itemAdded', this, s + 'Added'
      this[member].bind 'itemRemoved', this, s + 'Removed'
  
      # Create new method to update UUIDs on added events
      this[s + 'Added'] = (list, item) ->
        this[s + 'Uuids'].push item
        @setUpdated true
        @persist()
  
      # Create new method to update UUIDs on removed events
      this[s + 'Removed'] = (list, item) ->
        this[s + 'Uuids'].remove item
        @setUpdated true
        @persist()
      
      this[member].find = (mode, options) ->
        if mode == 'first' || mode == 'all'
          all = mode == 'all';
          if options && options.conditions
            filter = (o) -> o.matches options.conditions
            return if all @array.collect filter
            else @array.find filter
          else
            return if all then this; else @objectAtIndex(0)
        else if mode == 'by' || mode == 'all_by'
          conditions = {}
          conditions[arguments[1]] = arguments[2]
          return @find(
            (if mode == 'by' then 'first'; else 'all'),
            {conditions: conditions}
          )
        else
          return this.array.find.apply(this.array, arguments);
      
      this[member + 'NeedsRebuild'] = true
    
    # Rebuild items in list if marked for rebuild
    if this[member + 'NeedsRebuild']
      uuids = this.attributes[ST.singularize(member) + 'Uuids']
      list = this[member]
      
      # Rebuild by accessing array directly, so that we don't fire off
      # our own triggers
      list.array.empty()
      for uuid in uuids
        object = ST.Model._byUuid[uuid]
        list.array.push object if object
      
      this[member + 'NeedsRebuild'] = false
    
    this[member]
  
  @method 'markChanged', ->
    @changed = true
  
  @method '_changed', (member, oldValue, newValue) ->
    @_super member, oldValue, newValue
    @markChanged()
  
  # Returns saveable object containing model data.
  @method 'objectify', ->
    output = {
      _model: @_class._name
      uuid:   @getUuid()
    }
    for attribute of @attributes
      value = @attributes[attribute]
      value = String(value) if value instanceof Date
      output[attribute] = value
    output
  
  # Saves model data and saved status in Storage for persistance.
  @method 'persist', ->
    if ST.Model.Storage && @persists
      output = @objectify()
      output._created = @created
      output._updated = @updated
      output._deleted = @deleted
      output._approved = @approved
      ST.Model.Storage.set @uuid, output
  
  # Removes model from all indexes.
  @method 'deindex', ->
    for attribute of @attributes
      indexName = "Index#{ST.ucFirst attribute}"
      value = @attributes[attribute]
      if @_class[indexName]
        index = @_class[indexName]
        index[value].remove this if index[value]
  
  # Marks model as destroyed, destroy to be propagated to server when 
  # possible.
  @method 'destroy', ->
    @deleted = @destroyed = true
    @deindex()
    @updated = @created = false
    @persist()
  
  # Removes all local data for model.
  @method 'forget', ->
    @deindex()
    delete ST.Model._byUuid[@uuid]
    STModel.Storage.remove @uuid if ST.Model.Storage
    STObject.prototype.destroy.apply this

  @classMethod 'attribute', (name, defaultValue) ->
    ucName = ST.ucFirst name
    
    @Attributes ||= {}
    @Attributes[name] = defaultValue
    
    @method "set#{ucName}", (newValue) ->
      oldValue = @attributes[name]
  
      # Set new value
      @attributes[name] = newValue
  
      # Update index
      if @_class["Index#{ucName}"]
        index = @_class["Index#{ucName}"];
        index[oldValue].remove this if index[oldValue]
        index[newValue] ||= ST.List.create()
        index[newValue].add this
  
      # Trigger changed event
      @_changed name, oldValue, newValue if @_changed
      @trigger 'changed', name, oldValue, newValue
      
      @setUpdated true
      @persist()
    
    @method "get#{ucName}", -> @attributes[name]
  
  @classMethod 'belongsTo', (name, assocModel, options={}) ->
    @attribute "#{name}Uuid"
    
    ucName = ST.ucFirst name
    
    @method "get#{ucName}", ->
      uuid = @get "#{name}Uuid"
      uuid && ST.Model._byUuid[uuid]
    
    @method "set#{ucName}", (value) ->
      ST.error 'Invalid object specified for association' if value && value._class._name != assocModel
      @set "#{name}Uuid", value && value.uuid
  
    if options.bind
      setUuidName = "set#{ucName}Uuid"
      oldSet = @prototype[setUuidName]
      @method setUuidName, (value) ->
        oldValue = @attributes[name]
        unless oldValue == value
          if oldValue.unbind
            for key of options.bind
              oldValue.unbind key, this
          oldSet.call this, value
          if newValue.bind
            for key of options.bind
              oldValue.bind key, this, options.bind[key]

  @classMethod 'hasMany', (name, assocModel, foreign=null, options={}) ->
    if foreign
      # One-to-many assocation through a Model and foreign key
      @method "get#{ST.ucFirst name}", ->
        this[name] ||= @_namespace.getClass(assocModel).where("#{foreign}Uuid", @uuid)
      
      if options && options.bind
        for key of options.bind
          @ManyBinds ||= []
          @ManyBinds.push {
            assoc:  member
            from:   key
            to:     options.bind[key]
          }
    else
      # One-to-many association using a Uuids attribute
      attr = "#{ST.singularize name}Uuids"
      ucAttr = ST.ucFirst attr
  
      @Attributes ||= {}
      @Attributes[attr] = Array
  
      #setCustomerUuids
      @method "set#{ucAttr}", (value) ->
        @attributes[attr] = value
        this["#{name}NeedsRebuild"] = true
        @setUpdated true
        @persist()
  
      #getCustomerUuids
      @method "get#{ucAttr}", -> @attributes[attr]
  
      ucName = ST.ucFirst name
      ucsName = ST.ucFirst ST.singularize(name)
  
      #getCustomers
      @method "get#{ucName}", -> @getManyList name
  
      #addCustomer
      @method "add#{ucsName}", (record) ->
        @getManyList(name).add record
        this
      
  @classMethod 'hasAndBelongsToMany', (name, assocModel) ->
    @ManyMany ||= []
    @ManyMany.push name
    @method "get#{ST.ucFirst name}", ->
      this[name] ||= STManyAssociation.create this, name
      this[name]
    
  @setStorage = (storage) ->
    ST.Model.Storage = storage;
    
    if storage
      # Save any existing models to new storage
      for object in ST.Model._byUuid
        object.persist()
  
      # Load any unloaded saved models from storage
      storage.each (key, value) ->
        if value && value._model && window[value._model] && !STModel.byUuid[key]
          model = ST.Model.createWithData value
          model.created = value._created if value._created?
          model.updated = value._updated if value._updated?
          model.deleted = value._deleted if value._deleted?
          model.approved = value._approved if value._approved?