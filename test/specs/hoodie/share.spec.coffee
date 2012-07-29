describe "Hoodie.Share", ->  
  beforeEach ->
    @hoodie  = new Mocks.Hoodie 
    @share = new Hoodie.Share @hoodie

  describe ".constructor", ->
    it "should set Hoodie.Share.Instance.hoodie", ->
      hoodie = 'check 1,2'
      new Hoodie.Share hoodie
      expect(Hoodie.Share.Instance.hoodie).toBe 'check 1,2'
  # /.constructor

  describe "('share_id') // called as function", ->
    it "should open the sharing"
  # /('share_id')

  describe ".instance", ->
    it "should point to Hoodie.Share.Instance"
  # /.instance

  describe ".create(options)", ->
    it "should initiate a new Hoodie.Share.Instance and save it", ->
       
  # /.create(options)
