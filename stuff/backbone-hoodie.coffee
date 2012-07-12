Backbone.connect = (url) ->
  Backbone.hoodie = new Hoodie url

Backbone.sync = (method, model_or_collection, options) ->
  {id, attributes, type} = model_or_collection
  type                 or= model_or_collection.model::type

  promise = switch method
    when "read"
      if id
        Backbone.hoodie.store.load(type, id)
      else
        Backbone.hoodie.store.loadAll()

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
    Backbone.hoodie.remote.on   "created:#{@model::type}", (id, attributes) => @add attributes, opts
    Backbone.hoodie.remote.on "destroyed:#{@model::type}", (id, attributes) => @get(id)?.destroy opts
    Backbone.hoodie.remote.on   "updated:#{@model::type}", (id, attributes) => @get(id)?.merge attributes, opts