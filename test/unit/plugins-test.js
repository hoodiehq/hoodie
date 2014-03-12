var expect = require('expect.js');
var plugins = require('../../lib/core/plugins');

var _ = require('lodash');

describe('plugins', function () {

  beforeEach(function () {
    this.pluginPath = process.cwd() + '/test/support/node_modules/hoodie-plugin-cheesecake';
  });

  describe('methods', function () {

    it('should expose n number of properties', function () {
      expect(_.size(plugins)).to.eql(12);
    });

    it('should have a startAll property', function () {
      expect(plugins).to.have.property('startAll');
    });

    it('should have a startPlugin property', function () {
      expect(plugins).to.have.property('startPlugin');
    });

    it('should have a hasWorker property', function () {
      expect(plugins).to.have.property('hasWorker');
    });

    it('should have a getPluginNames property', function () {
      expect(plugins).to.have.property('getPluginNames');
    });

  });

});

