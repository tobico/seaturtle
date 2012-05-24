#= require ST/Object
#= require ST/Enumerable
#= require ST/Inflector

ST.module 'Model', ->
  @class 'Base', ->
    @classMethod 'fetch', (uuid, callback) ->
      self = this
    
      if ST.Model._byUuid[uuid]
        callback ST.Model._byUuid[uuid] if callback
      else if @FETCH_URL
        $.ajax {
          url:      @FETCH_URL.replace('?', uuid)
          type:     'get'
          data:     @FETCH_DATA || {}
          success:  (data) ->
            model = self.createWithData data, {loaded: true}
            callback model if callback
        }
      else
        ST.error "No find URL for model: #{@_name}"
  
    @classDelegate 'where', 'scoped'
    @classDelegate 'order', 'scoped'
    @classDelegate 'each',  'scoped'
    @classDelegate 'first', 'scoped'
    @classDelegate 'count', 'scoped'
    
    @include ST.Model.Callbacks
    @callback 'create'
    @callback 'destroy'
    
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
    
    @classMethod 'master', ->
      @_master ||= ST.List.create()
    
    @classMethod 'index', (attribute) ->
      @_indexes ||= {}
      @_indexes[attribute] ||= ST.Model.Index.createWithModelAttribute(this, attribute)
  
    @initializer (options={}) ->
      @initWithData {}, options
      this
  
    # Initializes a new model, and loads the supplied attribute data, if any
    @initializer 'withData', (data, options={}) ->
      self = this
      
      @callBefore 'create' unless options.loaded
      
      ST.Object.prototype.init.call this
      
      @uuid data.uuid || ST.Model._generateUUID()
      @_creating = true
      @_attributes = {}
      for attribute, details of @_class._attributes
        if @_class._attributes.hasOwnProperty(attribute)
          if data[attribute]?
            @[attribute] data[attribute]
          else if !details.virtual
            @[attribute] details.default
      
      # Add class to indexes
      if @_class._indexes
        for attribute of @_class._attributes
          if @_class._attributes.hasOwnProperty(attribute)
            if index = @_class._indexes[attribute]
              index.add @_attributes[attribute], this 
    
      if @_class._manyBinds
        for binding in @_class._manyBinds
          @get(binding.assoc).bind binding.from, self, binding.to
      
      unless options.loaded || @_class.ReadOnly
        ST.Model.recordChange 'create', @_uuid, @_class._name, @data()
      
      @_creating = false
      @_class.master().add this
      
      @callAfter 'create' unless options.loaded
  
    # Creates a new object from model data. If the data includes a 
    # property, as with data genereated by #objectify, the specified model
    # will be used instead of the model createWithData was called on.
    @classMethod 'createWithData', (data, options={}) ->
      # If data is being sent to the wrong model, transfer to correct model
      if data.model && data.model != @_name
        if modelClass = @_namespace.class data.model
          modelClass.createWithData data, options
        else
          null
      # If object with uuid already exists, return existing object
      else if data.uuid && ST.Model._byUuid[data.uuid]
        ST.Model._byUuid[data.uuid]
      # Otherwise, create a new object
      else
        object = new this
        object.initWithData data, options
        object
  
    @property 'uuid'
  
    @method 'setUuid', (newUuid) ->
      unless @_uuid
        newUuid = String newUuid
        
        # Insert object in global index
        ST.Model._byUuid[newUuid] = this
    
        # Insert object in model-specific index
        @_class._byUuid ||= {}
        @_class._byUuid[newUuid] = this
    
        @_uuid = newUuid
  
    @method 'matches', (conditions) ->
      if @_attributes
        for condition in conditions
          return false unless condition.test this
        true
      else
        false
  
    @method '_changed', (member, oldValue, newValue) ->
      @super member, oldValue, newValue
      @_class.trigger 'itemChanged', this
      
      if @_attributes[member] isnt undefined
        unless @_creating || String(oldValue) == String(newValue) || @_class.ReadOnly
          data = {}
          data[member] = newValue
          ST.Model.recordChange 'update', @_uuid, @_class._name, data
    
    @method 'writeAttribute', (name, rawValue) ->
      oldValue = @_attributes[name]
    
      # Convert new value to correct type
      details = @_class._attributes[name]
      newValue = @_class.convertValueToType rawValue, details.type
  
      # Set new value
      @_attributes[name] = newValue

      if @_creating
        @indexForKeyword newValue if @_class._searchProperties && @_class._searchProperties.indexOf(name) >= 0
      else
        # Update index
        if @_class._indexes
          if index = @_class._indexes[name]
            index.remove  oldValue, this
            index.add     newValue, this

        # Trigger changed event
        @_changed name, oldValue, newValue if @_changed
        @trigger 'changed', name, oldValue, newValue
    
    # Returns saveable object containing model data.
    @method 'data', ->
      output = {}
      for attribute of @_attributes
        if @_attributes.hasOwnProperty attribute
          value = @_attributes[attribute]
          value = String(value) if value instanceof Date
          output[attribute] = value
      output
  
    # Saves model data and saved status in Storage for persistance.
    @method 'persist', ->
      if ST.Model._storage
        ST.Model._storage.set @uuid(), JSON.stringify(@data())
    
    # Removes all local data for model.
    @method 'forget', (destroy=false) ->  
      @callBefore 'destroy' if destroy
    
      # Record destruction in change list, if destroy is true
      if destroy && !@_class.ReadOnly
        ST.Model.recordChange 'destroy', @_uuid, @_class._name
      
      # Unbind any loose bindings
      if @_boundTo
        for binding in @_boundTo
          binding.source.unbindOne binding.trigger, this
      
      # Propagate to dependent associated objects
      if @_class._dependent
        for dependent in @_class._dependent
          @[dependent]().forgetAll destroy

      # Remove from global index
      delete ST.Model._byUuid[@_uuid]
    
      # Remove from model index
      delete @_class._byUuid[@_uuid]
    
      # Remove from attribute indexes
      if @_class._indexes
        for attribute, index of @_class._indexes
          index.remove @_attributes[attribute], this if index.remove
    
      # Remove from persistant storage
      ST.Model._storage.remove @_uuid if ST.Model._storage
    
      @_class.master().remove this
      
      @_destroyed = true if destroy
      
      @callAfter 'destroy' if destroy
    
    # Marks model as destroyed, destroy to be propagated to server when 
    # possible.
    @method 'destroy', ->
      @forget true
  
    @classMethod 'convertValueToType', (value, type) ->
      if value is null
        null
      else
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
    
    @classMethod 'attribute', (name, type, options) ->
      ucName = ST.ucFirst name
    
      @_attributes ||= {}
      @_attributes[name] = {
        type:     type
        virtual:  false
        default:  null
        null:     true
      }
      for option, value of options
         @_attributes[name][option] = value
      
      @method "set#{ucName}", (rawValue) ->
        @writeAttribute name, rawValue
    
      @method "get#{ucName}", -> @_attributes[name]
    
      @accessor name
      @matchers name
    
    # Create convenience attribute method for each data type
    for type in ['string', 'integer', 'real', 'bool', 'datetime', 'enum']
      @classMethod type, do (type) ->
        (name, options) ->
          @attribute name, type, options
    
    @classMethod 'virtual', (name, type, defaultValue) ->
      @accessor name
      @_attributes ||= {}
      @_attributes[name] = {
        default:  defaultValue,
        type:     type,
        virtual:  true
      }
      @matchers name
    
    @classMethod 'matchers', (name) ->
      _not = ->
        oldTest = @test
        {
          attribute: @attribute
          test:      (item) -> !oldTest(item)
        }
    
      @[name] = {
        null: () ->
          {
            attribute:  name
            test:       (item) -> item[name]() is null
            not:        _not
          }
        equals: (value) ->
          value = String(value)
          {
            type:       'equals'
            attribute:  name
            value:      value
            test:       (item) -> String(item[name]()) == value
            not:        _not
          }
        equalsci: (value) ->
          value = String(value).toLowerCase()
          {
            attribute:  name
            value:      value
            test:       (item) -> String(item[name]()).toLowerCase() == value
            not:        _not
          }
        lessThan: (value) ->
          value = Number value
          {
            attribute:  name
            value:      value
            test:       (item) -> Number(item[name]()) < value
            not:        _not
          }
        lessThanOrEquals: (value) ->
          value = Number value
          {
            attribute:  name
            value:      value
            test:       (item) -> Number(item[name]()) <= value
            not:        _not
          }
        greaterThan: (value) ->
          value = Number value
          {
            attribute:  name
            value:      value
            test:       (item) -> Number(item[name]()) > value
            not:        _not
          }
        greaterThanOrEquals: (value) ->
          value = Number value
          {
            attribute:  name
            value:      value
            test:       (item) -> Number(item[name]()) >= value
            not:        _not
          }
        tests: (callback) ->
          {
            attribute:  name
            test:       callback
            not:        _not
          }
      }
  
    @classMethod 'belongsTo', (name, options={}) ->
      @string "#{name}Uuid"
    
      ucName = ST.ucFirst name
      options.model ||= ucName
    
      @method "get#{ucName}", ->
        uuid = @["#{name}Uuid"]()
        ST.Model._byUuid[uuid] || null
    
      @method "set#{ucName}", (value) ->
        ST.error 'Invalid object specified for association' if value && value._class._name != options.model
        @["#{name}Uuid"](value && value.uuid())
    
      @virtual(name, 'belongsTo', null)
      
      for option of options
        if options.hasOwnProperty option
          @_attributes[name][option] = options[option]
      
      matchers = @["#{name}Uuid"]
      @[name] = {
        is: (value) ->
          matchers.equals(value && String(value.uuid()))
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

    @classMethod 'hasMany', (name, options={}) ->
      foreign = options.foreign || @_name.toLowerCase()
      modelName = options.model || ST.ucFirst(ST.singularize(name))
    
      # One-to-many assocation through a Model and foreign key
      @method name, ->
        unless this["_#{name}"]
          model = @_class._namespace.class modelName
          scope = this["_#{name}"] = model.where(model["#{foreign}Uuid"].equals(@uuid()))
          scope.addBindings()
        this["_#{name}"]
    
      if options.bind
        for key of options.bind
          @_manyBinds ||= []
          @_manyBinds.push {
            assoc:  name
            from:   key
            to:     options.bind[key]
          }
      
      if options.dependent
        @_dependent ||= []
        @_dependent.push name
    
    @classMethod 'labelForAttribute', (attribute) ->
      ST.ucFirst(attribute.replace(/([A-Z])/g, " $1").replace(/\sUuid$/, ''))
  
    @include ST.Model.Searchable