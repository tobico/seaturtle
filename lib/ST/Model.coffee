#require ST/Model/Base
#require ST/Model/Scope
#require ST/Model/Index

ST.module 'Model', ->
  @_byUuid        = {}
  @_notFound      = {}
  @_generateUUID  = Math.uuid || (-> @NextUUID ||= 0; @NextUUID++)
  @_storage       = null
  
  @trigramsFor = (string) ->
    trigrams = []
    string = " #{string} ".toLowerCase().replace(/\s+/g, '  ')
    for i in [0..(string.length - 3)]
      trigrams.push string.substring(i, i + 3)
    trigrams
  
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