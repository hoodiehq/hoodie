// # Implementation of public user stores
// 
// From hoodie's frontend API perspective, every user has a store which
// is private by default. Nobody but the user himself is able to access
// this data, authenticated by a username and a password.
// 
// Above that, objects can selectively be set to be public. Entire objects
// or only some of the attributes.

// ## Step one: create or make an object public

// We create a profile with a name and an email address. This will internally
// create an sync a couchDB doc that looks like this:
// 
//     {
//       "_id"       : "profile/uuid567",
//       "_ref"      : "1-5so4hkn",
//       "type"      : "profile",
//       "name"      : "Joe Doe",
//       "email"     : "joe@example.com",
//       "createdAt" : "2012-07-12T21:55:42.228Z",
//       "updatedAt" : "2012-07-12T21:55:42.228Z"
//     }
// 
hoodie.my.store.create("profile", {
  name  : "Joe Doe",
  email : "joe@example.com"
})

// To make it available to other users, it needs to be made public. We use
// the `store.update` method for it. Simply leave the update object empty 
// and pass a `{ public: true }` hash as the forth parameter. This will update
// the couchDB document and look like this:
// 
//     {
//       "_id"       : "profile/uuid567",
//       "_ref"      : "2-cr3m5g8",
//       "$public"   : true,
//       "type"      : "profile",
//       "name"      : "Joe Doe",
//       "email"     : "joe@example.com",
//       "createdAt" : "2012-07-12T21:55:42.228Z",
//       "updatedAt" : "2012-07-12T21:55:42.228Z"
//     }
//
hoodie.my.store.update("profile", "uuid567", {}, { public: true })

// instead of making the entire profile public, we can select specific
// attributes to be made publicly available while the rest will be hidden.
// The resulting couchDB doc will look like this:
// 
//     {
//       "_id"       : "profile/uuid567",
//       "_ref"      : "3-7apxftr",
//       "$public"   : ["name"],
//       "type"      : "profile",
//       "name"      : "Joe Doe",
//       "email"     : "joe@example.com",
//       "createdAt" : "2012-07-12T21:55:42.228Z",
//       "updatedAt" : "2012-07-12T21:55:42.228Z"
//     }
// 
hoodie.my.store.update("profile", "uuid567", {}, { public: ["name"] })

// when you want to make an object private again, simply set public to false.
// We now could simply remove the $public attribut, but we intentionally set
// it to false, otherwise the public store worke would ignore it (see blelow)
// 
//     {
//       "_id"       : "profile/uuid567",
//       "_ref"      : "4-ldva53g",
//       "type"      : "profile",
//       "$public"   : "false",
//       "name"      : "Joe Doe",
//       "email"     : "joe@example.com",
//       "createdAt" : "2012-07-12T21:55:42.228Z",
//       "updatedAt" : "2012-07-12T21:55:42.228Z"
//     }
hoodie.my.store.update("profile", "uuid567", {}, { public: false })

// ## Step 2: Synchronization with public store
// 
// In hoodie's internal implementation with couchDB, each user will have two
// couchDB database when public stores are enabled. The first is the standard
// one and is private, only accessible by by the user after authentication.
// The second one is the "public user store" and contains only the objects
// that have been set to be public as described above.

// Let's say the user created a public profile object which gets synchronized
// to his private store as usual:
{
  "_id"       : "profile/uuid567",
  "_ref"      : "2-cr3m5g8",
  "$public"   : true,
  "type"      : "profile",
  "name"      : "Joe Doe",
  "email"     : "joe@example.com",
  "createdAt" : "2012-07-12T21:55:42.228Z",
  "updatedAt" : "2012-07-12T21:55:42.228Z"
}

// The **public store worker** listens to changes on the users private store 
// (e.g. `http://myapp.hood.ie/joe`) and watches for documents with a 
// `$public` attribute. If the one above  shows up in the `_changes` feed, it
// will create or update the respective object in the public store
// (e.g. `http://myapp.hood.ie/joe/public`)
{
  "_id"       : "$public/profile/uuid567",
  "_ref"      : "2-cr3m5g8",
  "type"      : "profile",
  "name"      : "Joe Doe",
  "email"     : "joe@example.com",
  "createdAt" : "2012-07-12T21:55:42.228Z",
  "updatedAt" : "2012-07-12T21:55:42.228Z"
}

// If the user created a public profile, but with only the name attribute
// beeing public (`"$public" : ["name"]`), the public store worker would
// turn it into the following doc:
{
  "_id"       : "$public/profile/uuid567",
  "_ref"      : "2-cr3m5g8",
  "type"      : "profile",
  "name"      : "Joe Doe"
}

// When a user makes a public object private again the `$private` attribute
// will be set to false as mentioned above. he public store worker would
// turn it into the following doc, which will remove it form the public store
{
  "_id"       : "$public/profile/uuid567",
  "_ref"      : "2-cr3m5g8",
  "_deleted"  : true
}


// ## the worker
// 
// the public store worker could be described as an extended filtered 
// replication. It listens for specific documents in Database A
// (user private store) and replicates them to Database B
// (user public store). But in contrast to standard CouchDB replications,
// the worker parses the document from A and turns it into a different object
// before creating or updating it in B.
// 
// The code for the worker will have a function wich will be called for every
// document coming from the users private store `_changes` feed. If the 
// function returns an object, the object will be PUT to users public store.

// The function might look like this:
function changes_doc_parser(obj) {
  switch(true) {
    // make object entirely public
    case obj.$public === true:
      delete obj.$public
      obj._id = "$public/" + obj._id
      return obj

    // make certain attributes public
    case Array.isArray(obj.$public):
      var newObj = {},
          defaultPublicAtts = ['_ref', 'type']

      obj.$public = obj.$public.concat(defaultPublicAtts)
      for (var i = 0, attr; i < obj.$public.length; i++) {
        attr = obj.$public[i]
        newObj[attr] = obj[attr]
      };
      obj._id = "$public/" + obj._id
      return obj

    // make public object private again, remove it from public store
    case obj.$public === false:
      obj._deleted = true
      return obj
  }
}