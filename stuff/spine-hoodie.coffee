#
# Spine ♥ Hoodie
#
# To use Hoodie as a Store for spine.js apps, require `spine-hoodie.coffee` in
# you bootstrap file and then extend your Models usin `Spine.Model.Hoodie`
#
#   Hoodie       = require('lib/spine-hoodie')
#   Spine.hoodie = new Hoodie(config.hoodie_url)
# 
#   class Car extends Spine.Model
#     @configure 'Image', 'color'
#     @extend Spine.Model.Hoodie
#

Spine.Model.Hoodie = 

  # extend the Model
  extended: ->

    # add type to attributes.
    # Turns `@configure 'Image', 'color'` into `@configure 'Image', 'type', 'color'`
    type = @className.toLowerCase()
    @attributes.unshift 'type'

    # hook into record events
    @change (object, event, data) =>
      switch event
        when 'create'
          Spine.hoodie.store.create type, object.toJSON()
        when 'update'
          Spine.hoodie.store.update type, object.id, object.toJSON()
        when 'destroy'
          Spine.hoodie.store.destroy type, object.id

    # fetch records from hoodie.store
    @fetch =>
      Spine.hoodie.store.findAll(type)
      .done (records) => @refresh(records)

    # listen to remote events on records
    Spine.hoodie.remote.on "change:#{type}", (event, remoteObject) => 
      switch event
        when 'create'
          @refresh remoteObject
        when 'destroye'
          @destroy remoteObject.id
        when 'update'
          localObject = @find(remoteObject.id)
          for attr, value of remoteObject
            localObject[attr] = value
          localObject.save()

module?.exports = Hoodie