#= require ST/Model/Searchable
#= require ST/Model/Callbacks
#= require ST/Model/Base
#= require ST/Model/Scope
#= require ST/Model/Index

ST.module 'Model', ->
  @_byUuid        = {}
  @_notFound      = {}
  @_generateUUID  = Math.uuid || (-> @NextUUID ||= 0; @NextUUID++)
  @_storage       = null
  @_changes       = {}
  @_changesCount  = 0
  @_changeID      = 1
  @_lastChange    = null
  
  @recordChange = (type, uuid, model, data) ->    
    # If the last change made was also an update to this model, and it hasn't
    # been submitted yet, amend the previous update with additional data
    # instead of making a new one
    if type == 'update' && @_lastChange && @_lastChange.type == 'update' && @_lastChange.uuid == uuid && !@_lastChange.submitted
      for attribute of data
        if data.hasOwnProperty attribute
          @_lastChange.data[attribute] = data[attribute]
    else
      change = {
        type:       type
        uuid:       uuid
        model:      model
        submitted:  false
      }
      change.data = data if data
      @_changes[@_changeID++] = change
      @_changesCount++
      @_lastChange = change
      @_onHasChanges @_changesCount if @_onHasChanges
    true
  
  @sync = (url, async, additionalData) ->
    if @_changesCount > 0 && !@_submitting
      self = this
      @_submitting = true
      @_onSyncStart @_changesCount if @_onSyncStart
      for id of @_changes
        if @_changes.hasOwnProperty id
          @_changes[id].submitted = true
      data = {changes: JSON.stringify(@_changes)}
      $.extend data, additionalData
      $.ajax {
        url:      url
        type:     'post'
        async:    async
        data:     data
        success:  (data) ->
          self._submitting = false
          self.ackSync data
        error: ->
          self._submitting = false
          self._onSyncError [] if self._onSyncError
      }
      true
    else
      false
  
  @autoSync = (url, options={}) ->
    sync = (async) ->
      ST.Model.sync url, async, options.data || {}
    
    options.savingClass   ||= 'saving'
    options.completeClass ||= 'saved'
    options.errorClass    ||= 'failed'
    
    allClasses = "#{options.savingClass} #{options.completeClass} #{options.errorClass}"
    
    setDisplayClass = (newClass) ->
      if options.statusDisplay
        options.statusDisplay.removeClass allClasses
        options.statusDisplay.addClass newClass if newClass
    
    @onSyncStart (count) ->
      if options.statusDisplay
        options.statusDisplay.html(
          ST.template(options.savingTemplate || 'Saving :count :changes...', {
            count:   count
            changes: if count == 1 then 'change' else 'changes'
          })
        )
        setDisplayClass options.savingClass
      options.onSyncStart() if options.onSyncStart
    
    hideDisplayTimeout = null
    
    hideDisplay = ->
      options.statusDisplay.empty()
      setDisplayClass null 
    
    cancelHideDisplay = ->
      if hideDisplayTimeout
        clearTimeout hideDisplayTimeout
        hideDisplayTimeout = null
    
    setHideDisplay = ->
      cancelHideDisplay()
      hideDisplayTimeout = setTimeout(hideDisplay, 5000)
    
    @onSyncContinue ->
      sync true
    
    @onSyncComplete ->
      if options.statusDisplay
        setDisplayClass options.completeClass
        options.statusDisplay.html(
          options.savedTemplate || 'Saved.'
        )
        setHideDisplay()
      options.onSyncComplete() if options.onSyncComplete
    
    @onSyncError (errors) ->
      if options.statusDisplay
        setDisplayClass options.errorClass
        options.statusDisplay.html(
          options.errorTemplate || 'Save failed!'
        )
        if errors.length
          a = $('<a href="javascript:;" style="display: inline">(' + errors.length + ' ' + (if errors.length == 1 then 'error' else 'errors') + ')</a>')
          items = []
          for error in errors
            items.push [error, (-> null)]
          a.popup(items, ->
            a.css 'font-weight', 'bold'
            $('#popup').css 'z-index', 10
          , ->
            a.css 'font-weight', 'normal'
          )
          options.statusDisplay.append ' ', a
      options.onSyncError() if options.onSyncError
    
    @onHasChanges ->
      setTimeout (-> sync true), 100
    
    if options.syncBeforeUnload
      window.onbeforeunload = (e) ->
        ev = e || window.event
        msg = if window.Connection && !Connection.active
          options.unsavedWarning || 'Unable to save your changes to the server. If you leave now, you will lose your changes.'
        else if ST.Model._submitting
          options.savingWarning || 'Currently writing your changes to the server. If you leave now, you will lose your changes.'
        else
          sync(false)
          undefined
        
        ev.returnValue = msg if ev && msg
        msg
    
    sync
  
  @ackSync = (data) ->
    errors = []
    if data.ack
      for id, status of data.ack
        if data.ack.hasOwnProperty id
          change = @_changes[id]
          if status == 'ok'
            delete @_changes[id]
            @_changesCount--
          else if status == 'notfound'
            errors.push "#{change.model} with UUID #{change.uuid} not found"
          else if status == 'unauthorized'
            errors.push "Access denied to #{change.model} with UUID #{change.uuid}"
          else if status == 'exists'
            errors.push "#{change.model} with UUID #{change.uuid} already exists"
          else if status == 'invalid'
            base = "#{change.model} with UUID #{change.uuid} failed to validate"
            if data.errors[id]
              for number, message of data.errors[id]
                errors.push "#{base} with message #{message}"
            else
              errors.push base
      for id of @_changes
        if @_changes.hasOwnProperty(id) && @_changes[id].submitted
          @_changes[id].submitted = false
          @_onSyncError errors if @_onSyncError
          return false
      if @_changesCount
        @_onSyncContinue() if @_onSyncContinue
      else
        @_onSyncComplete() if @_onSyncComplete
      true
    else
      @_onSyncError errors if @_onSyncError
      false
  
  # Event handler - called when changes are available to sync
  @onHasChanges = (fn) ->
    @_onHasChanges = fn

  # Event handler - called when a sync request starts
  @onSyncStart = (fn) ->
    @_onSyncStart = fn

  # Event handler - called when sync request finishes, but there are new changes
  @onSyncContinue = (fn) ->
    @_onSyncContinue = fn

  # Event handler - called when sync request finishes and there are no new changes
  @onSyncComplete = (fn) ->
    @_onSyncComplete = fn

  # Event handler - called when sync request fails with error message
  @onSyncError = (fn) ->
    @_onSyncError = fn
  
  @changes = ->
    @_changesCount

  @storage = (newStorage) ->
    self = this
    if newStorage?
      @Storage = storage
      
      if newStorage
        # Save any existing models to new storage
        for object in @_byUuid
          object.persist()

        # Load any unloaded saved models from storage
        storage.each (key, value) ->
          if value && value.model && window[value.model] && !self._byUuid[key]
            model = ST.Model.Base.createWithData value
    else
      @Storage