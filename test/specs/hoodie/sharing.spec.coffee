define 'specs/hoodie/sharing', ['mocks/hoodie', 'hoodie/sharing', 'hoodie/sharing/instance'], (HoodieMock, Sharing, SharingInstance) ->
  
  describe "Sharing", ->  
    beforeEach ->
      @hoodie = new HoodieMock 
      @sharing = new Sharing @hoodie

    describe ".constructor", ->
      it "should set SharingInstance.hoodie", ->
        hoodie = 'check 1,2'
        new Sharing hoodie
        expect(SharingInstance.hoodie).toBe 'check 1,2'
    # /.constructor

    describe ".create", ->
      beforeEach ->
        spyOn(SharingInstance, "create")

      it "should call SharingInstance.create", ->
        options = funky: 'fresh'
        @sharing.create options
        expect(SharingInstance.create).wasCalledWith options
    # /.create

    describe ".destroy", ->
      beforeEach ->
        spyOn(SharingInstance, "destroy")

      it "should call SharingInstance.destroy", ->
        @sharing.destroy 123
        expect(SharingInstance.destroy).wasCalledWith 123
    # /.destroy
