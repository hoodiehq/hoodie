class Hoodie.ShareInstance extends Hoodie.Remote
  
  # default values
  # ----------------

  # shares are not accessible to others by default.
  access: false


  # constructor
  # -------------
  
  # initializes a new share
  #
  constructor: (@hoodie, options = {}) ->

    # make sure that we have an id
    @id = options.id or @hoodie.uuid()

    # set name from id
    @name = "share/#{@id}"

    super