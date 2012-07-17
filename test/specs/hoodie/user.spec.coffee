describe "Hoodie.User", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @user = new Hoodie.User @hoodie