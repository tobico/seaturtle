ST.module 'Model', ->
  @module 'Validates', ->
    @included ->
      @property 'errors'

    # Adds validations for a property
    @classMethod 'validates', (property, validations) ->
      @_validations ||= {}
      if @_validations[property]
        $.extend @_validations[property], validations
      else
        @_validations[property] = validations

    # Validates a given data set
    @classMethod 'validate', (data) ->
      errors = {}
      valid = true
      for key, value of data
        if propertyErrors = @validateProperty(key, value)
          valid = false
          errors[key] = propertyErrors
      errors unless valid

    # Validates a value for a single property, and returns a list of errors
    @classMethod 'validateProperty', (property, value)  ->
      if validations = @_validations && @_validations[property]
        errors = []
        for name, options of validations
          ST.Model.Validates._validators[name](value, errors, options)
        errors if errors.length

    # Checks if current attributes of model are valid
    @method 'valid', ->
      @_errors = @_class.validate(@_attributes)
      !@_errors

    # Define validators

    @validator = (name, definition) ->
      @_validators ||= {}
      @_validators[name] = definition

    @validator 'presence', (value, errors) ->
      errors.push 'is required' unless ST.presence(value)

    @validator 'length', (value, errors, options) ->
      if options instanceof Array
        options = {
          min: options[0]
          max: options[1]
        }

      if ST.presence(value)
        if options.min? && value.length < options.min
          errors.push "must be at least #{options.min} characters"
        if options.max? && value.length > options.max
          errors.push "must be at most #{options.max} characters"

    @validator 'within', (value, errors, options) ->
      if ST.presence(value)
        if options.indexOf(value) is false
          errors.push "must be one of #{options.join ', '}"