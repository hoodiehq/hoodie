define 'specs/hoodie/config', ['mocks/hoodie', 'hoodie/config'], (HoodieMock, Config) ->
  
  describe "Config", ->  
    beforeEach ->
      @hoodie = new HoodieMock 
      @config = new Config @hoodie
    
    describe ".constructor(@hoodie, options)", ->
      it "should default @prefix to 'hoodie'", ->
        config = new Config @hoodie 
        expect(config.namespace).toBe 'hoodie'
    # /.constructor(@hoodie, options)
     
    describe ".set(key, value)", ->
      beforeEach ->
        spyOn(@hoodie.store, "update")
      
      it "should save a $config with key: value", ->
        @config.set('funky', 'fresh')
        expect(@hoodie.store.update).wasCalledWith '$config', 'hoodie', funky: 'fresh'
    # /.set(key, value)
    
    describe ".get(key)", ->
      beforeEach ->
        spyOn(@hoodie.store, "load").andReturn @hoodie.defer().resolve funky: 'fresh'
        @config = new Config @hoodie
      
      it "should get the config using store", ->
        expect(@config.get('funky')).toBe 'fresh'
    # /.get(key)
    
    describe ".remove(key)", ->
      beforeEach ->
        spyOn(@hoodie.store, "update").andReturn 'promise'
        
      it "should remove the config using store", ->
        @config.remove('funky')
        expect(@hoodie.store.update).wasCalledWith '$config', 'hoodie', funky: undefined
    # /.remove(key)