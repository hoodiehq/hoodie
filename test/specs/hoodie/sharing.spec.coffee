define 'specs/hoodie/sharing', ['mocks/hoodie', 'hoodie/sharing', 'hoodie/sharing/instance'], (HoodieMock, Sharing, SharingInstance) ->
  
  describe "Sharing", ->  
    beforeEach ->
      @hoodie  = new HoodieMock 
      @sharing = new Sharing @hoodie

    describe ".constructor", ->
      it "should set SharingInstance.hoodie", ->
        hoodie = 'check 1,2'
        new Sharing hoodie
        expect(SharingInstance.hoodie).toBe 'check 1,2'
    # /.constructor
    
    # don't know how to spec the SharingInstance usage
    # within the Sharing class ...