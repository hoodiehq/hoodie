

// ### Usecase 8: Share Subscriptions

// I can subscribe to a share by others. It can be used just like the `open`
// method, with the difference that an internal $shareAccess object will be 
// added to my store. This allows me to get a list of all shares I've access 
// to.
hoodie.share.subscription.create("share_id")

/* or */
hoodie.share.open( "share_id" ).done( function(share) {
  share.subscribe()
})

// I can pass options when creating a subscription, like a password for 
// protected shares or continuous if I want to continuously synchronize with // the share 
hoodie.share.subscription.create("share_id", {
  continuous: true,
  password: "secret"
})