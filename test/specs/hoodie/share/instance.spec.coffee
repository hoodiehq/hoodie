describe "Hoodie.Share.Instance", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    Hoodie.Share.Instance.prototype.hoodie = @hoodie
    @share = new Hoodie.Share.Instance
  
  describe "constructor", ->
    beforeEach ->
      spyOn(@hoodie.my.store, "uuid").andReturn 'newId'
      spyOn(Hoodie.Share.Instance::, "set")
      
    it "should set the attributes", ->
      share = new Hoodie.Share.Instance {funky: 'options'}
      expect(Hoodie.Share.Instance::set).wasCalledWith {funky: 'options'}
      expect('funky').toBe 'fresh'
    
    _when "called without options", ->
      it "should have some specs"

    _when "called with id: 'uuid567'", ->
      it "should have some specs"

    _when "called with access: true", ->
      it "should have some specs"

    _when "called with access: [user1, user2]", ->
      it "should have some specs"

    _when "called with access: { read: true }", ->
      it "should have some specs"

    _when "called with access: { write: [user1, user2] }", ->
      it "should have some specs"

    _when "called with access: { read: [user1], write: [user2, user3] }", ->
      it "should have some specs"

    _when "called with continuous: true", ->
      it "should have some specs"

    _when "called with password: 'secret'", ->
      it "should have some specs"

    _when "called with objects: [obj1, obj2]", ->
      it "should have some specs"
    

    ###
    _when "user is anonymous", ->
      beforeEach ->
        @hoodie.my.account.username = undefined
      
      it "should use the ShareHoodie", ->
        share = new Hoodie.Share.Instance
        expect(share.hoodie.constructor).toBe ShareHoodie
        
      it "should set anonymous to true", ->
        share = new Hoodie.Share.Instance
        expect(share.anonymous).toBeTruthy()
      
        
    _when "user has an account", ->
      beforeEach ->
        @hoodie.my.account.username = 'joe@example.com'
      
      it "should use the ShareHoodie", ->
        share = new Hoodie.Share.Instance
        expect(share.hoodie.constructor).toBe HoodieMock
        
      it "should set anonymous to false", ->
        share = new Hoodie.Share.Instance
        expect(share.anonymous).toBeFalsy()
    ###
  # /constructor