describe "Hoodie.Share.Hoodie", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @shareHoodie  = new Hoodie.Share.Hoodie @hoodie