// Public User Stores
// ====================

// Every user has a store which is private by default. Nobody but the user
// himself is able to access this data, authenticated by a username and a 
// password.
// 
// Beyond that, users can make specific objects available to other users, 
// read only. This document describes how that works.


// ## Make objects public
// 
// Objects can either be made public entirely, or selected attributes of
// the an object. To make an object public, pass the `public: true` option
// as demonstrated in the code examples:

/* make objects entirely public */
options = { "public": true}

/* or: make seleceted attributes of objects public */
options = { "public": ["name"] }

profilAttributes = { name: "Joe", email: "joe@example.com"}
hoodie.my.store.create("profile", profilAttributes, options)
hoodie.my.store.save("profile", "uuid567", profilAttributes, options)
hoodie.my.store.update("profile", "uuid567", {}, options)

// to make a public object private again, pass the `public: false` option
options = { "public": false }
hoodie.my.store.save("profile", "uuid567", profilAttributes, options)
hoodie.my.store.update("profile", "uuid567", {}, options)


// ## Open public objects

// I can acces public objects from other users.
hoodie.user("joey").store.loadAll( function(publicObjects){
  /* do something with Joey's public objects */
})

// I can also pull all objects from Joey's store and save them
// into my own store
hoodie.user("joey").store.pull()


// ## use case1: private instagram-ish app
// 
// Our photo sharing exmaple app to showcase hoodie:
// hoodiehq.github.com/app-photo
// 
// There is only one Model: Photo. The challange is that a 
// picture can be public, so everyone knowing my username
// can see it in my public photo stream.


// ### Scenario 1

// I want to make a photo public
// 
hoodie.my.store.update("photo", "abc4567", {}, {public: true})


// ### Scenario 2

// I want to make a public photo private again
// 
hoodie.my.store.update("photo", "abc4567", {}, {public: false})


// ### Scenario 3

// I want to see my friends photos
// 
hoodie.user("friendname").store.loadAll( showPhotos )


// ### Scenario 4

// show most recently uploaded public photos
// 
hoodie.global.store.loadList("most_recent_photos", {page: 2})
.done( function(photos) {
  renderPhotos(photos)
})


// ## usecase 2: whiskie.net
// 
// whiskie is a music player frontend for tumblr.com. It allows you 
// to make a favorites playlist that is publically visible. It also
// counts track plays to meassure its popularity
// 
// 
// **Models**
// 
// * Profiles
// * Tracks    (have global play count)
// * Favorites (belong to track and profile)
// 
// 
// **Hoodie Challanges**
// 
// 1. public profiles of users with their favorites
// 2. global play counts of tracks
// 


// ### Scenario 1

// A user plays a track. We need to make sure that the track object exists
// and then we want to increase its play count by creating a related
// play object.
// 
function playTrack( track ) {

  hoodie.my.store.findOrCreate( "track", track.id, track, {"public": true})
  hoodie.my.store.create("play", {trackId: trackAtts.id}, {"public": true})
}

tumblrTrack = {
  "id"          : "track123id",
  "artist"      : "Queen",
  "name"        : "Champion",
  "url"         : "http://tumblr.com/awoft32p",
  "coverImgUrl" : "http://images.tumblr.com/ytaw3t.png"
}
playTrack( tumblrTrack )


// ### Scenario 2

// I want to favorite or unfavorite a track
// 
function favoriteTrack( track ) {
  hoodie.my.store.create( "favorite", { trackId = track.id })
}

function unfavoriteTrack( track ) {
  hoodie.my.store.loadAll( function(trackAtts) {
    return trackAtts.type === "track" && trackAtts.trackId === track.id
  }).done( function( arrTrackAtts ) {
    hoodie.my.store.delete( "favorite", arrTrackAtts[0].trackId )
  })
}

// ### Scenario 3

// Show favorites from a user http://whiskie.net/user/espy
// 
hoodie.user('espy').store.loadAll("favorite")
.done( function( favorites ) {
  renderFavorites( favorites )
} ) 

function renderFavorites (favorites) {
  /* get global playcounts */
  var favoritesIds = favorites.map( function(fav) { return fav.id })

  hoodie.global.store.loadList("tracks_with_play_counts", {
    ids: favoritesIds
  }).done( function(tracks) {

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i]
      $("<li>"+track.name+" ("+track.playCount+")</li>").appendTo("#tracks")
    };
  })
}

// ### Scenario 4

// Currently trendings tracks
// 
hoodie.global.store.loadList("trending_tracks")
.done( renderTrendingTracks )