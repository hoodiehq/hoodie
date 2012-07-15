


// open a "store"
hoodie.open("user/funk/public").loadAll( function(objects) { /* ... */ })
hoodie.open("share/abc832", {password: "secret"}).pull()
hoodie.open("global").on("created:track", function(track) { /* ... */ })

// shortcuts
hoodie.user('funk')
hoodie.share('abc832')
hoodie.global