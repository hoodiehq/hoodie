define 'specs/hoodie/sharing/instance', ['mocks/hoodie', 'hoodie/sharing/instance'], (HoodieMock, SharingInstance) ->
  
  describe "SharingInstance", ->  
    beforeEach ->
      @hoodie = new HoodieMock 
      @sharing  = new SharingInstance @hoodie