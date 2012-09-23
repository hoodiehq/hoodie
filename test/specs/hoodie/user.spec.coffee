describe "Hoodie.User", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 

  describe "constructor", ->
    beforeEach ->
      spyOn(@hoodie, "open").andReturn 'storeApi'
    
    it "should return a shortcut for hoodie.open", ->
      user = new Hoodie.User @hoodie
      expect(user('uuid123')).toBe 'storeApi'
      expect(@hoodie.open).wasCalledWith 'user/uuid123/public'
  # /constructor