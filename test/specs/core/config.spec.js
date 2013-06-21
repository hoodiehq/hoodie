describe("Hoodie.Config", function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie;
    return this.config = new Hoodie.Config(this.hoodie);
  });
  describe("constructor(@hoodie, options)", function() {
    it("should default @type to '$config'", function() {
      var config;
      config = new Hoodie.Config(this.hoodie);
      return expect(config.type).toBe('$config');
    });
    return it("should default @id to 'hoodie'", function() {
      var config;
      config = new Hoodie.Config(this.hoodie);
      return expect(config.id).toBe('hoodie');
    });
  });
  describe("#set(key, value)", function() {
    beforeEach(function() {
      return spyOn(this.hoodie.store, "update");
    });
    it("should save a $config with key: value", function() {
      this.config.set('funky', 'fresh');
      return expect(this.hoodie.store.update).wasCalledWith('$config', 'hoodie', {
        funky: 'fresh'
      }, {
        silent: false
      });
    });
    return it("should make the save silent for local settings starting with _", function() {
      this.config.set('_local', 'fresh');
      return expect(this.hoodie.store.update).wasCalledWith('$config', 'hoodie', {
        _local: 'fresh'
      }, {
        silent: true
      });
    });
  });
  describe("#get(key)", function() {
    beforeEach(function() {
      spyOn(this.hoodie.store, "find").andReturn(this.hoodie.defer().resolve({
        funky: 'fresh'
      }));
      return this.config = new Hoodie.Config(this.hoodie);
    });
    return it("should get the config using store", function() {
      return expect(this.config.get('funky')).toBe('fresh');
    });
  });
  return describe("#remove(key)", function() {
    beforeEach(function() {
      return spyOn(this.hoodie.store, "update").andReturn('promise');
    });
    return it("should remove the config using store", function() {
      this.config.set('funky', 'fresh');
      this.config.remove('funky');
      return expect(this.hoodie.store.update).wasCalledWith('$config', 'hoodie', {
        funky: void 0
      }, {
        silent: false
      });
    });
  });
});
