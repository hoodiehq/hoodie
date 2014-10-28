require('../../lib/setup');

var hoodieId = require('../../../src/hoodie/id');
var utils = require('../../../src/utils');
var config = utils.config;

describe('id()', function() {
  it('returns newly generated id', function() {
    expect(hoodieId.id({})).to.be.ok();
  });

  it('returns existing id', function() {
    expect(hoodieId.id({id: 'foo'})).to.be('foo');
  });
});

describe('setId()', function() {
  it('sets passed id on state', function() {
    var state = {};
    hoodieId.setId(state, 'foo');

    expect(state.id).to.be('foo');
  });

  it('sets passed id on config', function() {
    hoodieId.setId({}, 'foo');

    expect(config.get('_hoodieId')).to.be('foo');
  });
});

describe('unsetId()', function() {
  it('unsets passed id on state', function() {
    var state = {id: 'foo'};
    hoodieId.unsetId(state);

    expect(state.id).to.be(undefined);
  });

  it('unsets passed id on config', function() {
    config.set('_hoodieId', 'foo');
    hoodieId.setId({});

    expect(config.get('_hoodieId')).to.be(undefined);
  });
});
