define 'specs/hoodie/sharing/hoodie', ['mocks/hoodie', 'hoodie/sharing/hoodie'], (HoodieMock, SharingHoodie) ->
  
  describe "SharingHoodie", ->  
    beforeEach ->
      @hoodie = new HoodieMock 
      @sharing_hoodie  = new SharingHoodie @hoodie