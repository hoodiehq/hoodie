define 'specs/hoodie/sharing', ['mocks/hoodie', 'hoodie/sharing'], (HoodieMock, Sharing) ->
  
  describe "Sharing", ->  
    beforeEach ->
      @hoodie = new HoodieMock 
      @sharing  = new Sharing @hoodie

  # /Sharing