require('../../../lib/setup');
var HoodieError = require('../../../../src/lib/error/error');

describe('#HoodieError()', function() {

  it('should be an Error', function() {
    var error = new HoodieError('No luck');
    expect(error).to.be.an(Error);
  });
  it('can be called with a string only', function() {
    var error = new HoodieError('There is no Santa Clause');
    expect(error.message).to.be('There is no Santa Clause');
  });
  it('can be called with an object', function() {
    var error = new HoodieError({ message: 'There is no Santa Clause' });
    expect(error.message).to.be('There is no Santa Clause');
  });
  it('defaults name to HoodieError', function() {
    var error = new HoodieError({ message: 'There is no Santa Clause' });
    expect(error.name).to.be('HoodieError');
  });
  it('falls back message to "Something went wrong"', function() {
    var error = new HoodieError({});
    expect(error.message).to.be('Something went wrong');
  });
  it('accepts a custom name for the error', function() {
    var error = new HoodieError({name: 'FunkMissingError', message: 'You don\'t have the funk!'});
    expect(error.name).to.be('FunkMissingError');
  });
  it('passes all other properties to instance', function() {
    var error = new HoodieError({
      name: 'FunkMissingError',
      message: 'You don\'t have the funk!',
      action: 'dance',
      song: 'I Feel Good'
    });
    expect(error.action).to.be('dance');
    expect(error.song).to.be('I Feel Good');
  });
  it('replaces {{placeholders}} with meta passed metadata', function() {
    var error = new HoodieError({
      message: 'Bacon not found in {{place}}',
      place: 'fridge'
    });
    expect(error.message).to.be('Bacon not found in fridge');
  });
});

