define 'specs/hoodie/sharing/instance', ['mocks/hoodie', 'hoodie/sharing/instance'], (HoodieMock, SharingInstance) ->
  
  describe "SharingInstance", ->  
    beforeEach ->
      @hoodie  = new HoodieMock 
      SharingInstance.hoodie = @hoodie
      @sharing = new SharingInstance
    
    describe "constructor", ->
      
      it "should set private to true when invitees passed", ->
        sharing = new SharingInstance 
          invitees: ['joe@example.com', 'bill@example.com']
        
        expect(sharing.private).toBeTruthy()
    # /constructor
    
    describe ".owner_uuid()", ->
      _when "config.sharing.owner_uuid is set to 'owner67'", ->
        beforeEach ->
          spyOn(SharingInstance.hoodie.config, "get").andCallFake (key) ->
            if key is 'sharing.owner_uuid'
              return 'owner67'
        
        it "should return 'owner67", ->
          expect(@sharing.owner_uuid()).toBe 'owner67'
          
      _when "config.sharing.owner_uuid is not set", ->
        beforeEach ->
          spyOn(SharingInstance.hoodie.config, "get").andReturn undefined
          spyOn(SharingInstance.hoodie.config, "set").andCallFake (key, value) -> value
          spyOn(SharingInstance.hoodie.store, "uuid").andReturn 'newuuid123'
        
        it "should return a new uuid", ->
          expect(@sharing.owner_uuid()).toBe 'newuuid123'
        
        it "should store the new owner_uuid in config", ->
          @sharing.owner_uuid()
          expect(SharingInstance.hoodie.config.set).wasCalledWith 'sharing.owner_uuid', 'newuuid123'
    # /.owner_uuid
    
    
    describe ".attributes(options)", ->
    
      it "should add the owner_uuid as attribute", ->
        spyOn(@sharing, "owner_uuid").andReturn 'owner987'
        expect(@sharing.attributes().owner_uuid).toBe 'owner987'
    
      it "should turn passed filters into a stringified fuction", ->
        attributes = @sharing.attributes
          filters: [
            shared: true
            public: true, price: 0, autor: "Joe Doe"
          ]
    
        expect(attributes.filter).toBe "function(obj) { return obj['shared'] == true && obj['public'] == true && obj['price'] == 0 && obj['autor'] == 'Joe Doe' }"
        
      it "should add owner_uuid to the options", ->
      # or: prefix sharing uuid with owner uuid
    # /.attributes(options)