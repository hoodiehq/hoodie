define 'specs/sharing', ['mocks/hoodie', 'hoodie/sharing'], (HoodieMock, Sharing) ->
  
  describe "Sharing", ->  
    beforeEach ->
      @hoodie = new HoodieMock 
      @sharing  = new Sharing @hoodie
    
    describe ".create(options)", ->
      beforeEach ->
        spyOn(@hoodie.store, "save")
      
      it "should set private to true when invitees passed", ->
        @sharing.create
          invitees: ['joe@example.com', 'bill@example.com']
          
        expect(@hoodie.store.save).wasCalledWith '$sharing', undefined, 
          private: true
          invitees: ['joe@example.com', 'bill@example.com']
          
      it "should turn passed filters into a stringified fuction", ->
        @sharing.create
          filters: [
            shared: true
            public: true, price: 0, autor: "Joe Doe"
          ]
        
        expect(@hoodie.store.save).wasCalledWith '$sharing', undefined, 
        filter: "function(obj) { return obj['shared'] == true && obj['public'] == true && obj['price'] == 0 && obj['autor'] == 'Joe Doe' }"
    # /.create(options)
  # /Sharing