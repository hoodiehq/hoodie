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
  

  # grant read access
  # -------------------
  #
  # grant read access to the share. If no users passed,
  # everybody can read the share objects. If one or multiple
  # users passed, only these users get read access.
  # 
  # examples:
  # 
  #     share.grantReadAccess()
  #     share.grantReadAccess('joe@example.com')
  #     share.grantReadAccess(['joe@example.com', 'lisa@example.com'])
  grantReadAccess: (users) ->
    if @access is true or @access.read is true
      return @hoodie.resolveWith this

    users = [users] if typeof users is 'string'
    if @access is false or @access.read is false
      if @access.read?
        @access.read = users or true
      else 
        @access = users or true

    if users
      currentUsers = @access.read or @access
      for user in users
        currentUsers.push(user) if currentUsers.indexOf(user) is -1

      if @access.read?
        @access.read = currentUsers
      else 
        @access = currentUsers

    else
      if @access.read?
        @access.read = true
      else 
        @access = true

    @hoodie.share.update(@id, access: @access)

  revokeReadAccess: (users) ->
    @revokeWriteAccess(users)

    if @access is false or @access.read is false
      return @hoodie.resolveWith this

    if users
      if @access is true  or @access.read is true
        return @hoodie.rejectWith this

      users = [users] if typeof users is 'string'

      currentUsers = @access.read or @access
      changed = false

      for user in users
        idx = currentUsers.indexOf(user)
        if idx != -1
          currentUsers.splice(idx, 1)
          changed = true

      unless changed
        return @hoodie.resolveWith this

      currentUsers = false if currentUsers.length is 0



      if @access.read?
        @access.read = currentUsers
      else 
        @access = currentUsers

    else
      @access = false
    
    @hoodie.share.update(@id, access: @access)

  grantWriteAccess: (users) ->
    @grantReadAccess(users)
    unless @access.read?
      @access = read: @access

    if @access.write is true
      return @hoodie.resolveWith this

    if users
      users = [users] if typeof users is 'string'
      @access.write = users
    else
      @access.write = true

    @hoodie.share.update(@id, access: @access)

  revokeWriteAccess: (users) ->
    unless @access.write?
      return @hoodie.resolveWith this

    if users
      if typeof @access.write is 'boolean'
        return @hoodie.rejectWith this

      users = [users] if typeof users is 'string'
      for user in users
        idx = @access.write.indexOf(user)
        if idx != -1
          @access.write.splice(idx, 1)

      if @access.write.length is 0
        @access = @access.read

    else
      @access = @access.read
      
    @hoodie.share.update(@id, access: @access)

  # PRIVATE
  # --------