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

    # set options
    $.extend this, options

    super
  

  # grant / revoke access
  # -----------------------
  grantReadAccess: (users) ->
    users = [users] if typeof users is 'string'

    if @access.read?
      @access.read = users or true
    else 
      @access = users or true

    @hoodie.share.update(@id, access: @access)

  revokeReadAccess: (users) ->
    if users
      if typeof @access is 'boolean' or typeof @access.read is 'boolean'
        return this

      users = [users] if typeof users is 'string'
      currentUsers = @access.read or @access
      for user in users
        idx = currentUsers.indexOf(user)
        if idx != -1
          currentUsers.splice(idx, 1)

      if @access.read?
        @access.read = currentUsers
      else 
        @access = currentUsers

    else
      @access = false
    
    @hoodie.share.update(@id, access: @access)

  grantWriteAccess: (users) ->
    @access = read: true if @access is 'boolean'

    users = [users] if typeof users is 'string'
    @access.write = users or true

    @hoodie.share.update(@id, access: @access)

  revokeWriteAccess: (users) ->
    return this unless @access.write?

    if users
      if typeof @access.write is 'boolean'
        return this

      users = [users] if typeof users is 'string'
      for user in users
        idx = @access.write.indexOf(user)
        if idx != -1
          @access.write.splice(idx, 1)

    else
      @access.write = false

    @hoodie.share.update(@id, access: @access)
    
  # PRIVATE
  # --------