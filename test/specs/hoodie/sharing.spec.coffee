describe "Hoodie.Sharing", ->  
  beforeEach ->
    @hoodie  = new Mocks.Hoodie 
    @sharing = new Hoodie.Sharing @hoodie

  describe ".constructor", ->
    it "should set Hoodie.Sharing.Instance.hoodie", ->
      hoodie = 'check 1,2'
      new Hoodie.Sharing hoodie
      expect(Hoodie.Sharing.Instance.hoodie).toBe 'check 1,2'
  # /.constructor