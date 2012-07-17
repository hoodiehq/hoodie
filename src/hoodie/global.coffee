# Public
# ========

# the Public Module provides a simple API to load objects from the global 
# stores
#
# For example, the syntax to load all objects from the global store
# looks like this:
#
#     hoodie.global.loadAll().done( handleObjects )
#
# okay, might not be the best idea to do that with 1+ million objects, but
# you get the point
#
class Hoodie.Global

  constructor: (hoodie) ->

    # vanilla API syntax:
    # hoodie.global.loadAll()
    return hoodie.open "global"