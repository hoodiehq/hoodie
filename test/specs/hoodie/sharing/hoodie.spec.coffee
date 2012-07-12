describe "Hoodie.Sharing.Hoodie", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @sharingHoodie  = new Hoodie.Sharing.Hoodie @hoodie