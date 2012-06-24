define 'specs/hoodie/sharing/instance', ['mocks/hoodie', 'hoodie/sharing/instance', 'hoodie/sharing/hoodie', 'hoodie/config'], (HoodieMock, SharingInstance, SharingHoodie, Config) ->

  describe "SharingInstance", ->  
    beforeEach ->
      @hoodie  = new HoodieMock 
      SharingInstance.hoodie = @hoodie
      @sharing = new SharingInstance
    
    describe "constructor", ->
      beforeEach ->
        spyOn(@hoodie.store, "uuid").andReturn 'new_id'
        spyOn(SharingInstance::, "set")
        spyOn(SharingInstance::, "add")
      
      it "should generate an id", ->
        sharing = new SharingInstance
        expect(sharing.id).toBe 'new_id'
        
      it "should set the attributes", ->
        sharing = new SharingInstance {funky: 'options'}
        expect(SharingInstance::set).wasCalledWith {funky: 'options'}
      
      _when "user is anonymous", ->
        beforeEach ->
          @hoodie.account.username = undefined
        
        it "should use the SharingHoodie", ->
          sharing = new SharingInstance
          expect(sharing.hoodie.constructor).toBe SharingHoodie
          
        it "should set anonymous to true", ->
          sharing = new SharingInstance
          expect(sharing.anonymous).toBeTruthy()
        
          
      _when "user has an account", ->
        beforeEach ->
          @hoodie.account.username = 'joe@example.com'
        
        it "should use the SharingHoodie", ->
          sharing = new SharingInstance
          expect(sharing.hoodie.constructor).toBe HoodieMock
          
        it "should set anonymous to false", ->
          sharing = new SharingInstance
          expect(sharing.anonymous).toBeFalsy()
      
    # /constructor