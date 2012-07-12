#
# Events
# ------
#
# extend any Class with support for
#
# * `object.bind('event', cb)`
# * `object.unbind('event', cb)`
# * `object.trigger('event', args...)`
# * `object.one('ev', cb)`
#
# based on [Events implementations from Spine](https://github.com/maccman/spine/blob/master/src/spine.coffee#L1)
#
  
class Events

  # ## Bind
  #
  # bind a callback to an event triggerd by the object
  #
  #     object.bind 'cheat', blame
  #
  bind: (ev, callback) ->
    evs   = ev.split(' ')
    calls = @hasOwnProperty('_callbacks') and @_callbacks or= {}

    for name in evs
      calls[name] or= []
      calls[name].push(callback)
  
  # alias
  on: @::bind

  # ## one
  # 
  # same as `bind`, but does get executed only once
  # 
  #     object.one 'groundTouch', gameOver
  one: (ev, callback) ->
    @bind ev, ->
      @unbind(ev, arguments.callee)
      callback.apply(@, arguments)


  # ## trigger
  #
  # trigger an event and pass optional parameters for binding.
  #
  #     object.trigger 'win', score: 1230
  trigger: (args...) ->
    ev = args.shift()

    list = @hasOwnProperty('_callbacks') and @_callbacks?[ev]
    return unless list

    callback.apply(@, args) for callback in list
      
    return true


  # ## unbind
  #
  # unbind to from all bindings, from all bindings of a specific event
  # or from a specific binding.
  #
  #     object.unbind()
  #     object.unbind 'move'
  #     object.unbind 'move', follow
  #
  unbind: (ev, callback) ->
    unless ev
      @_callbacks = {}
      return this

    list = @_callbacks?[ev]
    return this unless list

    unless callback
      delete @_callbacks[ev]
      return this

    for cb, i in list when cb is callback
      list = list.slice()
      list.splice(i, 1)
      @_callbacks[ev] = list
      break
    
    return this