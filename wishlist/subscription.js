// hoodie Subscription module
// ============================



// I can subscribe to a store. It can be used just like `hoodie.open`, 
// with the difference that an internal $subscription object will be 
// added to my store. This allows me to get a list of all 
// I've access to.
hoodie.subscription.create("store")

/* or */
hoodie.open( "store" ).subscribe()

hoodie.share("share_id").subscribe()
hoodie.user("janl").subscribe()

// I can pass options when creating a subscription, like a password for 
// protected shares
hoodie.subscription.create("share_id", {
  password: "secret"
})

{
  id: "store_name",
  type: "$subscription",
  password: secret
}

{
  id: "123",
  type: "car",
  $sharings: {
    "share_id": true
  }
}

hoodie.store.update("car", "123", {price: "12,34"})
