

// # Subscriptions

// I can subscribe to a store. It can be used just like `hoodie.open`, 
// with the difference that an internal $shareAccess object will be 
// added to my store. This allows me to get a list of all shares 
// I've access to.
hoodie.subscription.create("store")

/* or */
hoodie.open( "store" ).subscribe()

// I can pass options when creating a subscription, like a password for 
// protected shares or continuous if I want to continuously synchronize with // the share 
hoodie.subscription.create("share_id", {
  continuous: true,
  password: "secret"
})