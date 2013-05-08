Backbone.connect = (url) ->
  Backbone.hoodie = new Hoodie url

Backbone.sync = (method, modelOrCollection, options) ->
  {id, attributes, type} = modelOrCollection
  type                 or= modelOrCollection.model.type

  promise = switch method
    when "read"
      if id
        Backbone.hoodie.store.find(type, id)
      else
        if options.filter
          Backbone.hoodie.store.findAll(options.filter)
        else
          Backbone.hoodie.store.findAll(type)

    when "create"
      Backbone.hoodie.store.add(type, attributes, options)

    when "update"
      Backbone.hoodie.store.update(type, id, attributes, options)

    when "delete"
      Backbone.hoodie.store.remove(type, id, options)

  if options.success
    promise.done (resp) ->
      options.success(modelOrCollection, resp, options)

  if options.error
    promise.fail (error) ->
      options.error(modelOrCollection, error, options)

# simple merge strategy: remote always wins.
# Feel free to overwrite.
Backbone.Model::merge           = (attributes) ->
  @set attributes, remote: true

# Make Collections listen to events.
Backbone.Collection::initialize = ->
  type = @model.type
  # @fetch()

  if type
    Backbone.hoodie.store.on    "add:#{type}", (id, attributes, options) =>
      @add attributes

    Backbone.hoodie.store.on "remove:#{type}", (id, attributes, options) =>
      @get(id)?.destroy options

    Backbone.hoodie.store.on "update:#{type}", (id, attributes, options) =>
      if options.remote
        @get(id)?.merge attributes
