// # example app: private instagram thingy
// 
// Our photo sharing exmaple app to showcase hoodie:
// hoodiehq.github.com/app-photo
// 
// 
// ## Models
// 
// * Photo
// 
// 
// ## Hoodie Challanges
// 
// 1. A picture can be private, so everyone knowing my username
//    can see it in my public photo stream.
// 


// ## Scenario 1
// 
// I want to make a photo public
// 
hoodie.my.store.update("photo", "abc4567", {}, {public: true})


// ## Scenario 2
// 
// I want to make a public photo private again
// 
hoodie.my.store.update("photo", "abc4567", {}, {public: false})