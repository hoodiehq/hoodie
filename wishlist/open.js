

// # hoodie.open
// 
// just some loose thoughts on a hoodie.open method.
// 

// open a "store"
hoodie.open("user/joe").push()
hoodie.open("user/jane/public").findAll( function(objects) {})
hoodie.open("share/abc8320", {password: "secret"}).pull()
hoodie.open("global").on("created:track", function(track) {})

// shortcuts
hoodie.my.remote.push()
hoodie.user('jane').findAll( function(objects) {})
hoodie.share('abc832', {password: "secret"}).pull()
hoodie.global.on("created:track", function(track) {})


// ## a "store" module?
// 
// I can open any kind of named store, like a sharing or a users public
// store. An "opened" store does always provide the same API whereat
// some might require special privileges. They all return a promise

// instantiate
store = hoodie.open("share/abc8320")

// store / find objects
store.find("todolist","xy20ad9")
store.findAll("todo")
store.create("todo", {name: "remember the milk"})
store.save("todo", "exists7", {name: "get some rest"})
store.update("todo", "exists7", {name: "get some rest"})
store.updateAll("todo", {done: true})
store.delete("todo", "exists7")
store.deleteAll("todo")
store.get("completed_todos")
store.post("notify", {"email": "jane@xmpl.com"})

// sync
store.connect()
store.disconnect()
store.pull()
store.push()
store.sync()

// event binding
store.on("event", callback)


// ## options

// password
hoodie.open("share/abc8320", {
  password: "secret"
})

// sync: continuously sync with store
hoodie.open("share/abc8320", {
  // funky!
  sync: true
})

// pull: continuously pull from store
hoodie.open("share/abc8320", {
  sync: { pull: true }
})

// push: continuously push to store
hoodie.open("share/abc8320", {
  sync: { push: true }
})

