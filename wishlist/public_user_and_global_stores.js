// 
// # example app: whiskie.net
// 
// whiskie is a music player frontend for tumblr.com. It allows you 
// to make a favorites playlist that is publically visible. It also
// counts track plays to meassure its popularity
// 
// 
// ## Models
// 
// * Profiles
// * Tracks    (have global play count)
// * Favorites (belong to track and profile)
// 
// 
// ## Hoodie Challanges
// 
// 1. public profiles of users with their favorites
// 2. global play counts of tracks
// 


// ## Scenario 1
// 
// A user plays a song. We need to make sure that the track object exists
// and then we want to increase its play count by creating a related
// play object.
// 
function playTrack( track ) {

  hoodie.my.store.findOrCreate( "track", track.id, track, {"public": true})
  .done( function(trackAtts) {
    hoodie.my.store.create("play", {trackId: trackAtts.id}, {"public": true})
  });  
}

tumblrTrack = {
  "id"          : "track123id",
  "artist"      : "Queen",
  "name"        : "Champion",
  "url"         : "http://tumblr.com/awoft32p",
  "coverImgUrl" : "http://images.tumblr.com/ytaw3t.png"
}
playTrack( tumblrTrack )


// ## Scenario 2
// 
// I want to favorite or unfavorite a track
// 
function favoriteTrack( track ) {
  hoodie.my.store.create( "favorite", {
    trackId = track.id
  })
}

function unfavoriteTrack( track ) {
  hoodie.my.store.loadAll( "favorite", function(trackAtts) {
    return trackAtts.trackId === track.id
  }).done( function( arrTrackAtts ) {
    hoodie.my.store.delete( "favorite", arrTrackAtts[0].trackId )
  })
}

// ## Scenario 3
// 
// Show favorites from a user http://whiskie.net/user/espy
// 
hoodie.user('espy').store.loadAll("favorite")
.done( function( favorites ) {
  renderFavorites( favorites )
} ) 

function renderFavorites (favorites) {
  // get global playcounts
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

// ## Scenario 4
// 
// Currently trendings songs
// 
hoodie.global.store.loadList("trending_tracks")
.done( renderTrendingTracks )
