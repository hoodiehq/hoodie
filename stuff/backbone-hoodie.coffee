Backbone.connect = (url) ->
  Backbone.hoodie = new Hoodie url

Backbone.sync = (method, modelOrCollection, options) ->
  {id, attributes, type} = modelOrCollection
  type                 or= modelOrCollection.model::type

  promise = switch method
    when "read"
      if id
        Backbone.hoodie.my.store.load(type, id)
      else
        Backbone.hoodie.my.store.loadAll()

    when "create"
      Backbone.hoodie.my.store.create(type, attributes)
      
    when "update"
      Backbone.hoodie.my.store.update(type, id, attributes)
      
    when "delete"
      Backbone.hoodie.my.store.delete(type, id)

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
    Backbone.hoodie.my.remote.on   "create:#{@model::type}", (id, attributes) => @add attributes, opts
    Backbone.hoodie.my.remote.on "destroye:#{@model::type}", (id, attributes) => @get(id)?.destroy opts
    Backbone.hoodie.my.remote.on   "update:#{@model::type}", (id, attributes) => @get(id)?.merge attributes, opts