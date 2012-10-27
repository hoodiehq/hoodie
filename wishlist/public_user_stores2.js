// Public User Stores (2nd thought)
// ==================================

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

// make object entirely public
hoodie.store.find('task', '123').publish()
hoodie.store.publish('task', '123')

// or: make seleceted attributes of objects public
hoodie.store.find('task', '123').publish(['title', 'description'])
hoodie.store.publish('task', '123', ['title', 'description'])

// make a public object private again
hoodie.store.find('task', '123').conceal()
hoodie.store.conceal('task', '123')

// or: make certain attributes of a published object private again
hoodie.store.find('task', '123').conceal(['description'])
hoodie.store.conceal('task', '123', ['description'])

// insert a new object and make it public
hoodie.store.insert('task', '456').publish()


// ## Open public objects

// I can acces public objects from other users.
hoodie.user("joey").store.findAll( function(publicObjects){
  /* do something with Joey's public objects */
})

// I can also pull all objects from Joey's store and save them
// into my own store
hoodie.user("joey").pull()


// ## use case1: private instagram-ish app
// 
// Our photo share exmaple app to showcase hoodie:
// hoodiehq.github.com/app-photo
// 
// There is only one Model: Photo. The challange is that a 
// picture can be public, so everyone knowing my username
// can see it in my public photo stream.


// ### Scenario 1

// I want to make a photo public
// 
hoodie.store.publish("photo", "abc4567")


// ### Scenario 2

// I want to make a public photo private again
// 
hoodie.store.conceal("photo", "abc4567")


// ### Scenario 3

// I want to see my friends photos
// 
hoodie.user("friendname").store.findAll( showPhotos )


// ### Scenario 4

// show most recently uploaded public photos
// 
hoodie.global.get("most_recent_photos", {page: 2})
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

  hoodie.store.findOrInsert( "track", track.id, track).publish()
  hoodie.store.insert("play", {trackId: track.id}).publish()
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
  hoodie.store.insert( "favorite", track.id)
}

function unfavoriteTrack( track ) {
  hoodie.store.remove( "favorite", track.id)
}

// ### Scenario 3

// Show favorites from a user http://whiskie.net/user/espy
// 
hoodie.user('espy').store.findAll("favorite")
.done( renderFavorites ) 

function renderFavorites (favorites) {
  /* get global playcounts */
  var favoritesIds = favorites.map( function(fav) { return fav.id })

  hoodie.global.get("tracks_with_play_counts", {
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
hoodie.global.get("trending_tracks")
.done( renderTrendingTracks )