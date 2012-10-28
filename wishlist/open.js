// hoodie.open
// =============
// 
// just some loose thoughts on a hoodie.open method.

// open a "store"
hoodie.open("user/joe")
hoodie.open("user/jane/public").store.findAll( function(objects) {})
hoodie.open("share/abc8320", {password: "secret"}).subscribe()
hoodie.open("global").on("store:created:track", function(track) {})

// shortcuts
hoodie.remote.push()
hoodie.user('jane').store.findAll( function(objects) {})
hoodie.share('abc832', {password: "secret"}).subscribe()
hoodie.global.on("store:created:track", function(track) {})


// ## a "store" module?
// 
// I can open any kind of named store, like a sharing or a users public
// store. An "opened" store does always provide the same API whereat
// some might require special privileges. They all return a promise

// instantiate
share = hoodie("share/abc8320")

// store / find objects
share.store.find("todolist","xy20ad9")
share.store.findAll("todo")
share.store.create("todo", {name: "remember the milk"})
share.store.save("todo", "exists7", {name: "get some rest"})
share.store.update("todo", "exists7", {name: "get some rest"})
share.store.updateAll("todo", {done: true})
share.store.remove("todo", "exists7")
share.store.removeAll("todo")
share.store.get("completed_todos")
share.store.post("notify", {"email": "jane@xmpl.com"})

// sync
share.connect()
share.disconnect()
share.pull()
share.push()
share.sync()

// event binding
share.on("event", callback)


// ## options

// password
hoodie.open("share/abc8320", {
  password: "secret"
})