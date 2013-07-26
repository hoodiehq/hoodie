describe("hoodie.config", function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie;

    this.findDefer = this.hoodie.defer()
    spyOn(this.hoodie.store, "find").andReturn(this.findDefer.promise())
    spyOn(this.hoodie.store, "update");
    hoodieConfig(this.hoodie)
  });
  describe("#set(key, value)", function() {
    it("should save a $config with key: value", function() {
      this.hoodie.config.set('funky', 'fresh');
      expect(this.hoodie.store.update).wasCalledWith('$config', 'hoodie', {
        funky: 'fresh'
      }, {
        silent: false
      });
    });
    it("should make the save silent for local settings starting with _", function() {
      this.hoodie.config.set('_local', 'fresh');
      expect(this.hoodie.store.update).wasCalledWith('$config', 'hoodie', {
        _local: 'fresh'
      }, {
        silent: true
      });
    });
  });
  describe("#get(key)", function() {
    beforeEach(function() {
      this.hoodie.store.find.andReturn(this.hoodie.defer().resolve({
        funky: 'fresh'
      }));

      // needs to be reinitialized due to caching on startup.
      hoodieConfig(this.hoodie)
    });
    it("should get the config using store", function() {
      expect(this.hoodie.config.get('funky')).toBe('fresh');
    });
  });
  describe("#remove(key)", function() {
    beforeEach(function() {
      this.hoodie.store.update.andReturn('promise');
    });
    it("should remove the config using store", function() {
      this.hoodie.config.set('funky', 'fresh');
      this.hoodie.config.remove('funky');
      expect(this.hoodie.store.update).wasCalledWith('$config', 'hoodie', {
        funky: void 0
      }, {
        silent: false
      });
    });
  });
});
