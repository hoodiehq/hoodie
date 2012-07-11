describe "Hoodie.Sharing.Hoodie", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @sharing_hoodie  = new Hoodie.Sharing.Hoodie @hoodie