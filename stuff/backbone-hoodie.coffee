Backbone.connect = (url) ->
  Backbone.hoodie = new Hoodie url

Backbone.sync = (method, modelOrCollection, options) ->
  {id, attributes, type} = modelOrCollection
  type                 or= modelOrCollection.model::type

  promise = switch method
    when "read"
      if id
        Backbone.hoodie.store.find(type, id)
      else
        Backbone.hoodie.store.findAll()

    when "create"
      Backbone.hoodie.store.create(type, attributes)
      
    when "update"
      Backbone.hoodie.store.update(type, id, attributes)
      
    when "delete"
      Backbone.hoodie.store.delete(type, id)

  promise.done options.success if options.success
  promise.fail options.error   if options.error

# simple merge strategy: remote always wins.
# Feel free to overwrite.
Backbone.Model::merge           = (attributes) -> 
  @set attributes, remote: true
  
# Make Collections listen to remote events.
Backbone.Collection::initialize = ->
  type = @model::type
  opts = remote: true
  
  if @model::type
    Backbone.hoodie.remote.on   "create:#{@model::type}", (id, attributes) => @add attributes, opts
    Backbone.hoodie.remote.on "destroye:#{@model::type}", (id, attributes) => @get(id)?.destroy opts
    Backbone.hoodie.remote.on   "update:#{@model::type}", (id, attributes) => @get(id)?.merge attributes, opts