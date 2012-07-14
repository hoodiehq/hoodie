describe "Hoodie.UserStore", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @user = new Hoodie.UserStore @hoodie