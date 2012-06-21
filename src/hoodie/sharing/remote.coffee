#
# Connection / Socket to our couch
#
# Remote is using couchDB's `_changes` feed to listen to changes
# and `_bulk_docs` to push local changes
#
# When hoodie.remote is active (default), it will continuously 
# synchronize, otherwise you sync, pull or push can be called
# manually
#

define 'hoodie/sharing/remote', ['hoodie/remote'], (Remote) ->
  
  # 'use strict'
  
  # needs to to have the same name due to hoodie's loading mechanism
  class Remote extends Remote
    
    # pull url
    #
    # The pull URL has an addition filter to only pull for the documents
    # that belong to the sharing
    #
    _pull_url : ->
      since = @get_seq()
      if @active # make a long poll request
        "/#{encodeURIComponent @hoodie.account.db()}/_changes?filter=%24sharing_#{@hoodie.sharing.id}/owned&include_docs=true&heartbeat=10000&feed=longpoll&since=#{since}"
      else
        "/#{encodeURIComponent @hoodie.account.db()}/_changes?filter=%24sharing_#{@hoodie.sharing.id}/owned&include_docs=true&since=#{since}"