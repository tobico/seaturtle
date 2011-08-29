#= require ST/List

ST.module 'Model', ->
  @class 'Scope', 'List', ->
    @initializer 'withModel', (model) ->
      @init()
      @_model = model
      @_conditions = []
      @_orders = null
      @_populated = false
  
    @initializer 'withScope', (scope) ->
      @init()
      @_model = scope._model
      @_conditions = scope._conditions && scope._conditions.slice(0)
      @_orders = scope._orders && scope._orders.slice(0)
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
  
    @method 'order', (orders...) ->
      @fork ->
        @_orders ||= []
        for order in orders
          if found = order.match /^(\w+) (desc|asc)$/i
            order = found[1]
            order = {reverse: order} if found[2].toLowerCase() == 'desc'
          @_orders.push order
    
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
      unless @_bindingsAdded
        @index().bind 'itemAdded',   this, 'targetItemAdded'
        @index().bind 'itemRemoved', this, 'targetItemRemoved'
        @_bindingsAdded = true
  
    @method 'removeBindings', ->
      if @_bindingsAdded
        @index().unbindAll(this)
        @_bindingsAdded = false
  
    @method 'bind', (trigger, receiver, selector) ->
      @populate()
      @addBindings()
      @super trigger, receiver, selector
  
    @method 'unbindAll', (receiver) ->
      @super receiver
      @removeBindings() unless @isBound()

    @method 'each', (yield) ->
      @populate()
      @super yield

    @method 'count', ->
      @populate()
      @super()
    
    @method 'sort', ->
      if @_orders
        orders = @_orders
        @_array.sort (a, b) ->
          for attribute in orders
            if attribute.reverse
              a_value = b.get attribute.reverse
              b_value = a.get attribute.reverse
            else
              a_value = a.get attribute
              b_value = b.get attribute
            return 1  if a_value > b_value
            return -1 if a_value < b_value
          0
    
    @method 'populate', ->
      unless @_populated || @_array.length
        @_populated = true
        
        self = this
        @index().each (candidate) ->
          self.add candidate if candidate.matches self._conditions
        
        @sort()
    
    @method 'forgetAll', (destroy=false) ->
      while item = @first()
        item.forget destroy
        @remove item
    
    @method 'destroyAll', ->
      @forgetAll true
    
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
      @sort()

    @method 'targetItemRemoved', (target, item) ->  
      @remove item