#require ST/List

ST.module 'Model', ->
  @class 'Scope', 'List', ->
    @initializer 'withModel', (model) ->
      @init()
      @_model = model
      @_conditions = []
      @_order = null
      @_populated = false
  
    @initializer 'withScope', (scope) ->
      @init()
      @_model = scope._model
      @_conditions = []
      for condition in scope._conditions
        @_conditions.push condition
      @_order = scope._order
      @_populated = false
  
    @property 'model', 'read'
  
    @method 'fork', (block) ->
      scope = @_class.createWithScope this
      block.call scope if block
      scope
    
    @method 'where', (conditions...) ->
      @fork ->
        for condition in conditions
          @_conditions.push condition
  
    @method 'order', (order) ->
      @fork ->
        @_order = order
    
    @method 'index', ->
      unless @_index
        @_index = @_model.master()
        
        if @_model._indexes
          cardinality = -1
          for condition in @_conditions
            if condition.type == 'equals'
              if index = @_model._indexes[condition.attribute]
                if index.cardinality() > cardinality
                  @_index = index.get condition.value
                  cardinality = index.cardinality()
      @_index

    @method 'addBindings', ->
      @index().bind 'itemAdded',   this, 'targetItemAdded'
      @index().bind 'itemRemoved', this, 'targetItemRemoved'
      @_bindingsAdded = true
  
    @method 'removeBindings', ->
      @index().unbindAll(this)
      @_bindingsAdded = false
  
    @method 'bind', (trigger, receiver, selector) ->
      @populate()
      @addBindings() unless @_bindingsAdded
      @super trigger, receiver, selector
  
    @method 'unbindAll', (receiver) ->
      @super receiver
      @removeBindings() if @_bindingsAdded && !@isBound()

    @method 'each', (yield) ->
      @populate()
      @super yield

    @method 'count', ->
      @populate()
      @super()
  
    @method 'populate', ->
      unless @_populated
        self = this
        
        @index().each (candidate) ->
          self.add candidate if candidate.matches self._conditions
        
        if @_order
          order = @_order
          @_array.sort (a, b) ->
            a_value = a.get order
            b_value = b.get order
            if a_value > b_value
              1
            else if a_value < b_value
              -1
            else
              0
        
        @_populated = true
  
    @method 'destroyAll', ->
      @each 'destroy'
  
    @method 'build', (data) ->
      defaults = {}
      for condition in @_conditions
        if condition.attribute && condition.value
          defaults[condition.attribute] = condition.value
      $.extend(defaults, data) if data
      @_model.createWithData defaults
  
    @method 'search', (keywords, limit) ->
      conditions = @_conditions
      @_model.search keywords, {limit: limit, filter: (item) ->
        item.matches conditions
      }
  
    @method 'targetItemAdded', (target, item) ->
      @add item if item.matches @_conditions

    @method 'targetItemRemoved', (target, item) ->  
      @remove item