var expect = require('expect.js');
var couchUtils = require('../../lib/utils/couch');
var _ = require('lodash');

describe('utils', function () {

  it('should expose n number of properties', function () {
    expect(_.size(couchUtils)).to.eql(13);
  });

  it('should have a isAdminParty property', function () {
    expect(couchUtils).to.have.property('isAdminParty');
  });

  it('should have a isAdminParty property', function () {
    expect(couchUtils).to.have.property('isAdminParty');
  });

  it('should have a saveAdminUser property', function () {
    expect(couchUtils).to.have.property('saveAdminUser');
  });

  it('should have a promptAdminUser property', function () {
    expect(couchUtils).to.have.property('promptAdminUser');
  });

  it('should have a checkCouchCredentials property', function () {
    expect(couchUtils).to.have.property('checkCouchCredentials');
  });

  it('should have a updateCouchCredentials property', function () {
    expect(couchUtils).to.have.property('updateCouchCredentials');
  });

  it('should have a promptCouchCredentials property', function () {
    expect(couchUtils).to.have.property('promptCouchCredentials');
  });

  it('should have a createDB property', function () {
    expect(couchUtils).to.have.property('createDB');
  });

  it('should have a createCouchCredentials property', function () {
    expect(couchUtils).to.have.property('createCouchCredentials');
  });

  it('should have a setupPlugins property', function () {
    expect(couchUtils).to.have.property('setupPlugins');
  });

  it('should have a setupApp property', function () {
    expect(couchUtils).to.have.property('setupApp');
  });

  it('should have a createAdminUser property', function () {
    expect(couchUtils).to.have.property('createAdminUser');
  });

  it('should have a createAppConfig property', function () {
    expect(couchUtils).to.have.property('createAppConfig');
  });

});
