describe "Hoodie.ShareInstance", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
  
  describe "constructor", ->
    it "should set id from options.id", ->
      share = new Hoodie.ShareInstance @hoodie, id: 'id123'
      expect(share.id).toBe 'id123'

    it "shoudl set name from id", ->
      share = new Hoodie.ShareInstance @hoodie, id: 'id123'
      expect(share.name).toBe 'share/id123'

    it "should generate an id if options.id wasn't passed", ->
      share = new Hoodie.ShareInstance @hoodie
      expect(share.id).toBe 'uuid'
  # /constructor