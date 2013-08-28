var expect = require('expect.js');
var installer = require('../../lib/installer');

describe('installer', function () {

  it('should have a generatePassword property', function () {
    expect(installer).to.have.property('generatePassword');
  });

  it('should have a isAdminParty property', function () {
    expect(installer).to.have.property('isAdminParty');
  });

  it('should have a checkCouchCredentials property', function () {
    expect(installer).to.have.property('checkCouchCredentials');
  });

  it('should have a pollCouch property', function () {
    expect(installer).to.have.property('pollCouch');
  });

  it('should have a createCouchCredentials property', function () {
    expect(installer).to.have.property('createCouchCredentials');
  });

  it('should have a createAppConfig property', function () {
    expect(installer).to.have.property('createAppConfig');
  });

  it('should have a promptAdminUser property', function () {
    expect(installer).to.have.property('promptAdminUser');
  });

  it('should have a saveAdminUser property', function () {
    expect(installer).to.have.property('saveAdminUser');
  });

  it('should have a createAdminUser property', function () {
    expect(installer).to.have.property('createAdminUser');
  });

  it('should have a promptCouchCredentials property', function () {
    expect(installer).to.have.property('promptCouchCredentials');
  });

  it('should have a updateCouchCredentials property', function () {
    expect(installer).to.have.property('updateCouchCredentials');
  });

  it('should have a setupUsers property', function () {
    expect(installer).to.have.property('setupUsers');
  });

  it('should have a install property', function () {
    expect(installer).to.have.property('install');
  });

});

