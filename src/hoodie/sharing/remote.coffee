# Remote patched for Sharing.
# 
# The only difference is the pull URL, it adds a filter to assure that
# only documents get pulled that belong to the sharing. This is importent
# when an object gets removed from the sharing, by removing the sharing id
# from the objects $sharings array and deleting the object. The filter
# avoids that the deletion will be synchronized through the _changes feed.
#

define 'hoodie/sharing/remote', ['hoodie/remote'], (Remote) ->
  
  # 'use strict'
  
  # needs to to have the same name due to hoodie's loading mechanism
  # see: Hoodie::_load_modules
  class Remote extends Remote
    
    # pull url
    #
    # The pull URL has an addition filter to only pull for the documents
    # that belong to the sharing, see above
    #
    _pull_url : ->
      since = @get_seq()
      if @active # make a long poll request
        "/#{encodeURIComponent @hoodie.account.db()}/_changes?filter=%24sharing_#{@hoodie.sharing.id}/owned&include_docs=true&since=#{since}&heartbeat=10000&feed=longpoll"
      else
        "/#{encodeURIComponent @hoodie.account.db()}/_changes?filter=%24sharing_#{@hoodie.sharing.id}/owned&include_docs=true&since=#{since}"