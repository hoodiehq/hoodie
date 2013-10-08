var expect = require('expect.js');
var plugins = require('../../lib/plugins');

var _ = require('underscore');

describe('plugins', function () {

  beforeEach(function () {
    this.pluginPath = process.cwd() + '/test/support/node_modules/hoodie-plugin-cheesecake';
  });

  describe('methods', function () {

    it('should expose n number of properties', function () {
      expect(_.size(plugins)).to.eql(10);
    });

    it('should have a startAll property', function () {
      expect(plugins).to.have.property('startAll');
    });

    it('should have a startPlugin property', function () {
      expect(plugins).to.have.property('startPlugin');
    });

    it('should have a id property', function () {
      expect(plugins).to.have.property('id');
    });

    it('should return a plugins name', function () {
      expect(plugins.id('cheesecake')).to.eql('hoodie-plugin-cheesecake');
    });

    it('should have a path property', function () {
      expect(plugins).to.have.property('path');
    });

    it('should return a plugin package path', function () {
      expect(plugins.path('cheesecake', process.cwd() + '/test/support/')).to.eql(this.pluginPath);
    });

    it('should have a hasWorker property', function () {
      expect(plugins).to.have.property('hasWorker');
    });

    it.skip('should should confirm worker existance', function () {});

    it('should have a getPluginModuleNames property', function () {
      expect(plugins).to.have.property('getPluginModuleNames');
    });

    it('should have a pluginModuleToName property', function () {
      expect(plugins).to.have.property('pluginModuleToName');
    });

    it('should have a getPluginNames property', function () {
      expect(plugins).to.have.property('getPluginNames');
    });

    it('should have a pluginPath property', function () {
      expect(plugins).to.have.property('pluginPath');
    });

    it('should have a readMetadata property', function () {
      expect(plugins).to.have.property('readMetadata');
    });

  });

});
