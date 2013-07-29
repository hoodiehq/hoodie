'use strict';

describe('Hoodie.ShareInstance', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();

    this.sandbox = sinon.sandbox.create();

    this.sandbox.spy(this.hoodie, 'resolveWith');
    this.updateDefer = this.hoodie.defer();

    this.sandbox.stub(this.hoodie.share, 'update').returns(this.updateDefer.promise());
    this.share = new Hoodie.ShareInstance(this.hoodie, {
      id: 'id123'
    });

    this.requestDefer = this.hoodie.defer();
    this.sandbox.stub(this.share, 'request').returns(this.requestDefer.promise());
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('constructor', function() {

    it('should set id from options.id', function() {
      var share = new Hoodie.ShareInstance(this.hoodie, {
        id: 'id123'
      });
      expect(share.id).to.eql('id123');
    });

    it('shoudl set name from id', function() {
      var share = new Hoodie.ShareInstance(this.hoodie, {
        id: 'id123'
      });
      expect(share.name).to.eql('share/id123');
    });

    it('shoudl set prefix from id', function() {
      var share = new Hoodie.ShareInstance(this.hoodie, {
        id: 'id123'
      });
      expect(share.prefix).to.eql('share/id123');
    });

    it('should generate an id if options.id wasn\'t passed', function() {
      var share = new Hoodie.ShareInstance(this.hoodie);
      expect(share.id).to.eql('uuid');
    });

    it('should set options', function() {
      var share = new Hoodie.ShareInstance(this.hoodie, {
        funky: 'fresh'
      });
      expect(share.funky).to.eql('fresh');
    });

    it('should default access to false', function() {
      var share = new Hoodie.ShareInstance(this.hoodie);
      expect(share.access).to.not.be.ok();
    });

  });

  describe('subscribe(options)', function() {

    it('should request _security object', function() {
      this.share.subscribe();
      expect(this.share.request.calledWith('GET', '/_security')).to.be.ok();
    });

    it('should return promise', function() {
      var share = this.share.subscribe();
      expect(share).to.have.property('done');
      expect(share).to.not.have.property('resolve');
    });

    _when('security has no members and writers', function() {

      beforeEach(function() {
        this.sandbox.spy(this.hoodie.share, 'findOrAdd');
        this.requestDefer.resolve({
          members: {
            names: [],
            roles: []
          },
          writers: {
            names: [],
            roles: []
          }
        });
      });

      it('should find or add new share', function() {
        this.share.subscribe();

        expect(this.hoodie.share.findOrAdd.calledWith('id123', {
          access: {
            read: true,
            write: true
          },
          createdBy: '$subscription'
        })).to.be.ok();
      });
    });

    _when('security members and writers include my ownerHash', function() {

      beforeEach(function() {
        this.sandbox.spy(this.hoodie.share, 'findOrAdd');

        this.requestDefer.resolve({
          members: {
            names: [],
            roles: ['owner_hash']
          },
          writers: {
            names: [],
            roles: ['owner_hash']
          }
        });
      });

      it('should find or add new share', function() {
        this.share.subscribe();

        expect(this.hoodie.share.findOrAdd.calledWith('id123', {
          access: {
            read: true,
            write: true
          },
          createdBy: '$subscription'
        })).to.be.ok();
      });

    });

    _when('security members include my ownerHash, but not writers', function() {

      beforeEach(function() {
        this.sandbox.spy(this.hoodie.share, 'findOrAdd');

        this.requestDefer.resolve({
          members: {
            names: [],
            roles: ['whatever', "owner_hash"]
          },
          writers: {
            names: [],
            roles: ['whatever']
          }
        });

      });

      it('should find or add new share', function() {
        this.share.subscribe();

        expect(this.hoodie.share.findOrAdd.calledWith('id123', {
          access: {
            read: true,
            write: false
          },
          createdBy: '$subscription'
        })).to.be.ok();
      });

    });

  });

  describe('unsubscribe(options)', function() {

    beforeEach(function() {
      this.sandbox.spy(this.hoodie.share, 'remove');
      this.sandbox.spy(this.hoodie.store, 'removeAll');
    });

    it('should remove share from store', function() {
      this.share.unsubscribe();
      expect(this.hoodie.share.remove.calledWith('id123')).to.be.ok();
    });

    it('should return itself', function() {
      var share = this.share.unsubscribe();
      expect(share).to.eql(this.share);
    });

    it('should remove all objects belonging to share, locally', function() {
      var filter, options, _ref;
      this.share.unsubscribe();

      _ref = this.hoodie.store.removeAll.args[0],
      filter = _ref[0],
      options = _ref[1];

      expect(filter({ $sharedAt: this.share.id })).to.eql(true);
      expect(filter({ $sharedAt: 'bazinga' })).to.eql(false);
      expect(options.local).to.eql(true);
    });

  });

  describe('#grantReadAccess(users)', function() {

    _when('share.access is false', function() {

      beforeEach(function() {
        this.share.access = false;
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.grantReadAccess();
        });

        it('should set access to true', function() {
          expect(this.share.access).to.eql(true);
        });

        it('should update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: true
          })).to.be.ok();
        });

        it('should return a promise from share.update', function() {
          this.updateDefer.resolve('funk');

          this.promise.then(function (res) {
            expect(res).to.equal('funk');
          });

          expect(this.promise.state()).to.eql('resolved');
        });

      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.share.grantReadAccess('joe@example.com');
        });

        it('should set access to [\'joe@example.com\']', function() {
          expect(this.share.access.join()).to.eql('joe@example.com');
        });

        it('should update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: ['joe@example.com']
          })).to.be.ok();
        });

      });

    });

    _when('share.access is {read: false}', function() {

      beforeEach(function() {
        this.share.access = {
          read: false
        };
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.grantReadAccess();
        });

        it('should set access to true', function() {
          expect(this.share.access.read).to.be.ok();
        });

        it('should update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: {
              read: true
            }
          })).to.be.ok();
        });

      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.share.grantReadAccess('joe@example.com');
        });

        it('should set access to [\'joe@example.com\']', function() {
          expect(this.share.access.read.join()).to.eql('joe@example.com');
        });

        it('should update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: {
              read: ['joe@example.com']
            }
          })).to.be.ok();
        });

      });

    });

    var _i, _len, access;

    var _ref = [
      true, {
        read: true
      }
    ];

    _when('share.access is ' + (JSON.stringify(access)), function() {
      beforeEach(function() {
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          access = _ref[_i];
        }
        this.share.access = access;
        this.promise = this.share.grantReadAccess();
      });

      it('should not call share.update', function() {
        expect(this.hoodie.share.update.called).to.not.be.ok();
      });

      it('should return a resolved promise', function() {
        expect(this.hoodie.resolveWith.calledWith(this.share)).to.be.ok;
        expect(this.promise.state()).to.eql('resolved');
      });

    });


    _when('share.access is [\'joe@example.com\']', function() {

      beforeEach(function() {
        this.share.access = ['joe@example.com'];
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.grantReadAccess();
        });

        it('should set access to true', function() {
          expect(this.share.access).to.be.ok();
        });

      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.share.grantReadAccess('joe@example.com');
        });

        it('should set access to joe@example.com', function() {
          expect(this.share.access.join()).to.eql('joe@example.com');
        });

      });

      _and('user \'lisa@example.com\' passed', function() {

        beforeEach(function() {
          this.share.grantReadAccess('lisa@example.com');
        });

        it('should set access to true', function() {
          expect(this.share.access.join(',')).to.eql('joe@example.com,lisa@example.com');
        });

      });

    });

  });

  describe('#revokeReadAccess(users)', function() {

    _when('share.access is true', function() {

      beforeEach(function() {
        this.share.access = true;
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.revokeReadAccess();
        });

        it('should set access to false', function() {
          expect(this.share.access).to.not.be.ok();
        });

        it('should update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: false
          })).to.be.ok();
        });

      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.promise = this.share.revokeReadAccess('joe@example.com');
        });

        it('should not change access', function() {
          expect(this.share.access).to.be.ok();
        });

        it('should not update share', function() {
          expect(this.hoodie.share.update.called).to.not.be.ok();
        });

        it('should return a rejected promise', function() {
          expect(this.promise.state()).to.eql('rejected');
        });

      });

    });

    _when('share.access is {read: true, write: [\'joe@example.com\']}', function() {

      beforeEach(function() {
        this.share.access = {
          read: true,
          write: ['joe@example.com']
        };
      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.promise = this.share.revokeReadAccess('joe@example.com');
        });

        it('should set access to true', function() {
          expect(this.share.access).to.be.ok();
        });

        it('should update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: true
          })).to.be.ok();
        });

        it('should return a rejected promise', function() {
          expect(this.promise.state()).to.eql('rejected');
        });

      });

    });

    _when('share.access is false', function() {

      beforeEach(function() {
        this.share.access = false;
        this.promise = this.share.revokeReadAccess();
      });

      it('should not call share.update', function() {
        expect(this.hoodie.share.update.called).to.not.be.ok();
      });

      it('should return a resolved promise', function() {
        expect(this.hoodie.resolveWith.calledWith(this.share)).to.be.ok();
        expect(this.promise.state()).to.eql('resolved');
      });

    });

    _when('share.access is [\'joe@example.com\']', function() {

      beforeEach(function() {
        this.share.access = ['joe@example.com'];
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.revokeReadAccess();
        });

        it('should set access to false', function() {
          expect(this.share.access).to.not.be.ok();
        });

      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.share.revokeReadAccess('joe@example.com');
        });

        it('should set access to false', function() {
          expect(this.share.access).to.not.be.ok();
        });

      });

      _and('user \'lisa@example.com\' passed', function() {

        beforeEach(function() {
          this.share.revokeReadAccess('lisa@example.com');
        });

        it('should not change access', function() {
          expect(this.share.access.join(',')).to.eql('joe@example.com');
        });

        it('should not update in store', function() {
          expect(this.hoodie.share.update.called).to.not.be.ok();
        });

      });

    });

  });

  describe('#grantWriteAccess(users)', function() {

    _when('share.access is false', function() {

      beforeEach(function() {
        this.share.access = false;
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.grantWriteAccess();
        });

        it('should set access to {read: true, write: true}', function() {
          expect(this.share.access.read).to.be.ok();
          expect(this.share.access.write).to.be.ok();
        });

        it('should update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: {
              read: true,
              write: true
            }
          })).to.be.ok();
        });
      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.share.grantWriteAccess('joe@example.com');
        });

        it('should set access to {read: [\'joe@example.com\'], write: [\'joe@example.com\']}', function() {
          expect(this.share.access.read.join()).to.eql('joe@example.com');
          expect(this.share.access.write.join()).to.eql('joe@example.com');
        });

        it('should update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: {
              read: ['joe@example.com'],
              write: ['joe@example.com']
            }
          })).to.be.ok();
        });

      });

    });

    _when('share.access is {read: true, write: true}', function() {

      beforeEach(function() {
        this.share.access = {
          read: true,
          write: true
        };
        this.promise = this.share.grantWriteAccess();
      });

      it('should not call share.update', function() {
        expect(this.hoodie.share.update.called).to.not.be.ok();
      });

      it('should return a resolved promise', function() {
        expect(this.hoodie.resolveWith.calledWith(this.share)).to.be.ok();
        expect(this.promise.state()).to.eql('resolved');
      });

    });

    _when('share.access is [\'joe@example.com\']', function() {

      beforeEach(function() {
        this.share.access = ['joe@example.com'];
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.grantWriteAccess();
        });

        it('should set access to {read: true, write: true}', function() {
          expect(this.share.access.read).to.be.ok();
          expect(this.share.access.write).to.be.ok();
        });

      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.share.grantWriteAccess('joe@example.com');
        });

        it('should set access to {read: [\'joe@example.com\'], write: [\'joe@example.com\']}', function() {
          expect(this.share.access.read.join()).to.eql('joe@example.com');
          expect(this.share.access.write.join()).to.eql('joe@example.com');
        });

      });

      _and('user \'lisa@example.com\' passed', function() {

        beforeEach(function() {
          this.share.grantWriteAccess('lisa@example.com');
        });

        it('should set access to {read: [\'joe@example.com\', \'lisa@example.com\'], write: [\'joe@example.com\']}', function() {
          expect(this.share.access.read.join(',')).to.eql('joe@example.com,lisa@example.com');
          expect(this.share.access.write.join(',')).to.eql('lisa@example.com');
        });

      });

    });

  });

  describe('#revokeWriteAccess(users)', function() {

    _when('share.access is true', function() {

      beforeEach(function() {
        this.share.access = true;
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.revokeWriteAccess();
        });

        it('should not change access', function() {
          expect(this.share.access).to.be.ok();
        });

        it('should not update share', function() {
          expect(this.hoodie.share.update.called).to.not.be.ok;
        });

      });

    });

    _when('share.access is {read: true, write: true}', function() {

      beforeEach(function() {
        this.share.access = {
          read: true,
          write: true
        };
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.revokeWriteAccess();
        });

        it('should change access to true', function() {
          expect(this.share.access).to.be.ok(true);
        });

        it('should not update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: true
          })).to.be.ok();
        });

      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.promise = this.share.revokeWriteAccess('joe@example.com');
        });

        it('should not change access', function() {
          expect(this.share.access.read).to.be.ok();
          expect(this.share.access.write).to.be.ok();
        });

        it('should not update share', function() {
          expect(this.hoodie.share.update.called).to.not.be.ok();
        });

        it('should return a rejected promise', function() {
          expect(this.promise.state()).to.eql('rejected');
        });

      });

    });

    _when('share.access is {read: true, write: [\'joe@example.com\']}', function() {

      beforeEach(function() {
        this.share.access = {
          read: true,
          write: ['joe@example.com']
        };
      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.promise = this.share.revokeWriteAccess('joe@example.com');
        });

        it('should set access to true', function() {
          expect(this.share.access).to.be.ok();
        });

        it('should update share', function() {
          expect(this.hoodie.share.update.calledWith('id123', {
            access: true
          })).to.be.ok();
        });

      });

    });

    _when('share.access is false', function() {

      beforeEach(function() {
        this.share.access = false;
        this.promise = this.share.revokeWriteAccess();
      });

      it('should not call share.update', function() {
        expect(this.hoodie.share.update.called).to.not.be.ok();
      });

      it('should return a resolved promise', function() {
        expect(this.hoodie.resolveWith.calledWith(this.share)).to.be.ok();
        expect(this.promise.state()).to.eql('resolved');
      });

    });

    _when('share.access is [\'joe@example.com\']', function() {

      beforeEach(function() {
        this.share.access = ['joe@example.com'];
      });

      _and('no users passed', function() {

        beforeEach(function() {
          this.promise = this.share.revokeWriteAccess();
        });

        it('should not change access', function() {
          expect(this.share.access.join()).to.eql('joe@example.com');
        });

      });

      _and('user \'joe@example.com\' passed', function() {

        beforeEach(function() {
          this.share.revokeWriteAccess('joe@example.com');
        });

        it('should not change access', function() {
          expect(this.share.access.join()).to.eql('joe@example.com');
        });

      });

      _and('user \'lisa@example.com\' passed', function() {

        beforeEach(function() {
          this.share.revokeWriteAccess('lisa@example.com');
        });

        it('should not change access', function() {
          expect(this.share.access.join(',')).to.eql('joe@example.com');
        });

        it('should not update in store', function() {
          expect(this.hoodie.share.update.called).to.not.be.ok();
        });

      });

    });

  });

});
