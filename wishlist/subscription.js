

// # Subscriptions

// I can subscribe to a store. It can be used just like `hoodie.open`, 
// with the difference that an internal $shareAccess object will be 
// added to my store. This allows me to get a list of all shares 
// I've access to.
hoodie.subscription.create("store")

/* or */
hoodie.open( "store" ).subscribe()

hoodie.share("share_id").subscribe()
hoodie.user("janl").subscribe()

// I can pass options when creating a subscription, like a password for 
// protected shares or continuous if I want to continuously synchronize with // the share 
hoodie.subscription.create("share_id", {
  continuous: true,
  password: "secret"
})

{
  id: "share_id",
  type: "$subscription",
  password: secret,
  writeAccess: true
}

{
  id: "123",
  type: "car",
  $sharings: {
    "share_id": true
  }
}

hoodie.my.store.update("car", "123", {price: "12,34"})
