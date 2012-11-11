# Share Instance
# ================

# A share instance provides an API to interact with a
# share. It's extending the default Remote Store by methods
# to grant or revoke read / write access.
# 
# By default, a share is only accessible to be. If I want
# it to share publicaly, I explicatly need to grant access
# by calling `share.grantReadAccess()`. I can also grant
# access to only specific users by passing an array: 
# `share.grantReadAccess(['joe','lisa'])`
# 
# It's plannend to secure a public share with a password,
# but this feature is not implemented yet.
# 
# To subscribe to a share created by somebody else, run
# this code: `hoodie.share('shareId').subscribe()`.
class Hoodie.ShareInstance extends Hoodie.Remote
  
  
  # default values
  # ----------------

  # shares are not accessible to others by default.
  access: false


  # constructor
  # -------------
  
  # initializes a new share
  #
  constructor : (@hoodie, options = {}) ->

    # make sure that we have an id
    @id = options.id or @hoodie.uuid()

    # set name from id
    @name = "share/#{@id}"

    # set options
    $.extend this, options

    super


  # subscribe
  # ---------

  # 
  subscribe : ->
    @request('GET', '/_security')
    .pipe (security) =>
      access     = @_parseSecurity security
      $createdBy = @name
      @hoodie.share.findOrAdd( @id, {access, $createdBy} )


  # unsubscribe
  # ---------

  # 
  unsubscribe : ->
    @hoodie.share.remove( @id )
    return this


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
  grantReadAccess : (users) ->
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


  # revoke read access
  # --------------------
  #
  # revoke read access to the share. If one or multiple
  # users passed, only these users' access gets revoked.
  # Revoking reading access always includes revoking write
  # access as well.
  # 
  # examples:
  # 
  #     share.revokeReadAccess()
  #     share.revokeReadAccess('joe@example.com')
  #     share.revokeReadAccess(['joe@example.com', 'lisa@example.com'])
  revokeReadAccess : (users) ->
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


  # grant write access
  # --------------------
  #
  # grant write access to the share. If no users passed,
  # everybody can edit the share objects. If one or multiple
  # users passed, only these users get write access. Granting
  # writing reads always also includes reading rights.
  # 
  # examples:
  # 
  #     share.grantWriteAccess()
  #     share.grantWriteAccess('joe@example.com')
  #     share.grantWriteAccess(['joe@example.com', 'lisa@example.com'])
  grantWriteAccess : (users) ->
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


  # revoke write access
  # --------------------
  #
  # revoke write access to the share. If one or multiple
  # users passed, only these users' write access gets revoked.
  # 
  # examples:
  # 
  #     share.revokeWriteAccess()
  #     share.revokeWriteAccess('joe@example.com')
  #     share.revokeWriteAccess(['joe@example.com', 'lisa@example.com'])
  revokeWriteAccess : (users) ->
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
  # ---------

  # a db _security response looks like this:
  # 
  #     {
  #       readers: {
  #           names: [],
  #           roles: ["1ihhzfy"]
  #       },
  #       writers: {
  #           names: [],
  #           roles: ["1ihhzfy"]
  #       }
  #     }
  # 
  # we want to turn it into
  # 
  #     {read: ["1ihhzfy"], write: ["1ihhzfy"]}
  _parseSecurity : (security) ->
    access = 
      read  : security.readers?.roles or []
      write : security.writers?.roles or []

    access.read  = true if access.read.length is 0
    access.write = true if access.write.length is 0

    access