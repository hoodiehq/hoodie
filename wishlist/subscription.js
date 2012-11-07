// hoodie Subscription module
// ============================

// I can subscribe to a store. It can be used just like `hoodie.open`, 
// with the difference that an internal $subscription object will be 
// added to my store. This allows me to get a list of all stores
// I've access to.
hoodie.subscription.add("store/123")

/* or */
hoodie.open( "store/123" ).subscribe()

hoodie.share("share_id").subscribe()
hoodie.user("janl").subscribe()

// unsubscribing works the same way
hoodie.user("janl").unsubscribe()

// I can pass options when creating a subscription, like a password for 
// protected shares
hoodie.subscription.add("share_id", {
  password: "secret"
})

// this will result in an object like this:
{
  id: "store_name",
  $type: "$subscription",
  password: "secret"
}


// Thoughts
// ----------

// First of all, I'm not sure if subscribtion is the right word,
// as it's not only about subscribing to changes in a remote store, 
// but also pushing updates back.
// 
// Next thing are shares: When I create a share, I automatically
// subscribe to it as well. Does that mean two objects get created
// when I create a share ($share & $subscription), or is one object
// sufficient? Maybe $share & $subscription can somehow be combined
// into one object? Something like $access? I dunno ...
// 
// To get things started, I want create extra $subscription objects
// when creating a new share. Manual subscription to other users shares
// or public stores can be added and removed manually. There won't 
// be any options, for now, they'll always be syncing continuously.