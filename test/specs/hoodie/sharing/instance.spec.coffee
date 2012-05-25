define 'specs/hoodie/sharing/instance', ['mocks/hoodie', 'hoodie/sharing/instance'], (HoodieMock, SharingInstance) ->
  
  describe "SharingInstance", ->  
    beforeEach ->
      @hoodie  = new HoodieMock 
      @sharing = new SharingInstance @hoodie
    
    describe "constructor", ->
      
      it "should set private to true when invitees passed", ->
        sharing = new SharingInstance @hoodie,
          invitees: ['joe@example.com', 'bill@example.com']
        
        expect(sharing.private).toBeTruthy()
    # /constructor
    
    describe "attributes(options)", ->
    
      it "should turn passed filters into a stringified fuction", ->
        attributes = @sharing.attributes
          filters: [
            shared: true
            public: true, price: 0, autor: "Joe Doe"
          ]
    
        expect(attributes.filter).toBe "function(obj) { return obj['shared'] == true && obj['public'] == true && obj['price'] == 0 && obj['autor'] == 'Joe Doe' }"
    # /.create(options)