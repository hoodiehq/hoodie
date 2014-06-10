require('../../../lib/setup');

// stub the requires before loading the actual module
var storeFactory = sinon.stub();
global.stubRequire('src/lib/store/api', storeFactory);

var generateIdMock = require('../../../mocks/utils/generate_id');
global.stubRequire('src/utils/generate_id', generateIdMock);

global.unstubRequire('src/lib/store/remote');
var hoodieRemoteStore = require('../../../../src/lib/store/remote');

describe('hoodieRemoteStore', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    generateIdMock.returns('uuid123');

    this.requestDefer = this.hoodie.defer();
    var promise = this.requestDefer.promise();
    promise.abort = sinon.spy();
    this.hoodie.request.returns( promise );

    this.clock = this.sandbox.useFakeTimers(0); // '1970-01-01 00:00:00'

    storeFactory.reset();
    storeFactory.returns( this.MOCKS.store.apply(this) );

    this.remote = hoodieRemoteStore(this.hoodie, { name: 'my/store'});
    this.storeBackend = storeFactory.args[0][1].backend;
  });

  describe('factory', function() {
    it('should fallback prefix to \'\'', function() {
      expect(this.remote.prefix).to.eql('');
    });

    _when('prefix: $public passed', function() {
      beforeEach(function() {
        this.remote = hoodieRemoteStore(this.hoodie, {
          prefix: '$public'
        });
      });

      it('should set prefix accordingly', function() {
        expect(this.remote.prefix).to.eql('$public');
      });
    }); // prefix: $public passed

    _when('baseUrl: http://api.otherapp.com passed', function() {
      beforeEach(function() {
        this.remote = hoodieRemoteStore(this.hoodie, {
          baseUrl: 'http://api.otherapp.com'
        });
      });

      it('should set baseUrl accordingly', function() {
        expect(this.remote.baseUrl).to.eql('http://api.otherapp.com');
      });
    }); // baseUrl: http://api.otherapp.com passed
  }); // factory

  describe('#request(type, path, options)', function() {
    beforeEach(function() {
      delete this.remote.name;
    });

    it('should proxy to hoodie.request', function() {
      this.hoodie.request.returns('funk');
      var returnedValue = this.remote.request('GET', '/something');

      expect(this.hoodie.request).to.be.called();
      expect(returnedValue).to.eql('funk');
    });

    it('should set options.contentType to "application/json"', function() {
      this.remote.request('GET', '/something');
      expect(this.hoodie.request).to.be.calledWith('GET', '/my%2Fstore/something', {
        contentType: 'application/json'
      });
    });

    it('should prefix path with @name (encoded)', function() {
      var remote = hoodieRemoteStore(this.hoodie, { name: 'my/funky/store'} );
      remote.request('GET', '/something');
      var typeAndPath = this.hoodie.request.args[0];

      expect(typeAndPath[1]).to.eql('/my%2Ffunky%2Fstore/something');
    });

    it('should prefix path with @baseUrl', function() {
      this.remote.baseUrl = 'http://api.otherapp.com';
      this.remote.request('GET', '/something');

      var typeAndPath = this.hoodie.request.args[0];

      expect(typeAndPath[1]).to.eql('http://api.otherapp.com/my%2Fstore/something');
    });

    _when('type is POST', function() {
      beforeEach(function() {
        var path, type;
        this.remote.request('POST', '/something');
        var args = this.hoodie.request.args[0];

        type = args[0];
        path = args[1];
        this.options = args[2];
      });

      it('should default options.dataType to "json"', function() {
        expect(this.options.dataType).to.eql('json');
      });

      it('should default options.dataType to "json"', function() {
        expect(this.options.processData).to.eql(false);
      });
    }); // type is POST
  }); // #request

  describe('#find(type, id)', function() {
    it('should send a GET request to `/type%2Fid`', function() {
      var path, type;
      this.storeBackend.find('car', '123');
      var _ref = this.hoodie.request.args[0];
      type = _ref[0],
      path = _ref[1];

      expect(type).to.eql('GET');
      expect(path).to.eql('/my%2Fstore/car%2F123');
    });

    _when('prefix is store_prefix/', function() {
      beforeEach(function() {
        this.remote = hoodieRemoteStore(this.hoodie, {
          name: 'my/store',
          prefix: 'store_prefix/'
        } );
        this.storeBackend = storeFactory.args[1][1].backend;
      });

      it('should send request to `store_prefix%2Ftype%2Fid`', function() {
        var path, type;
        this.storeBackend.find('car', '123');
        var _ref = this.hoodie.request.args[0];

        type = _ref[0],
        path = _ref[1];

        expect(type).to.eql('GET');
        expect(path).to.eql('/my%2Fstore/store_prefix%2Fcar%2F123');
      });

      _and('request successful', function() {
        beforeEach(function() {
          this.requestDefer.resolve({
            _id: 'store_prefix/car/fresh',
            createdAt: '2012-12-12T22:00:00.000Z',
            updatedAt: '2012-12-21T22:00:00.000Z'
          });
        });

        it('should resolve with the doc', function() {
          this.storeBackend.find('todo', '1').then(function (res) {
            expect(res).to.eql({
              id: 'fresh',
              type: 'car',
              createdAt: '2012-12-12T22:00:00.000Z',
              updatedAt: '2012-12-21T22:00:00.000Z'
            });
          });
        });
      }); // request successful
    }); // prefix is store_prefix/
  }); // #find

  describe('#findAll(type)', function() {
    it('should return a promise', function() {
      expect(this.storeBackend.findAll()).to.promise();
    });

    _when('type is not set', function() {

      _and('prefix is empty', function() {

        beforeEach(function() {
          this.remote.prefix = '';
        });

        it('should send a GET to /_all_docs?include_docs=true', function() {
          this.storeBackend.findAll();
          expect(this.hoodie.request).to.be.calledWith('GET', '/my%2Fstore/_all_docs?include_docs=true', { 'contentType': 'application/json' });
        });

      });

      _and('prefix is "$public"', function() {

        beforeEach(function() {
          this.remote.prefix = '$public/';
        });

        it('should send a GET to /_all_docs?include_docs=true&startkey="$public/"&endkey="$public0"', function() {
          this.storeBackend.findAll();
          expect(this.hoodie.request).to.be.calledWith('GET', '/my%2Fstore/_all_docs?include_docs=true&startkey="%24public%2F"&endkey="%24public0"', { 'contentType': 'application/json' });
        });
      });
    }); // type is not set

    _when('type is todo', function() {
      it('should send a GET to /_all_docs?include_docs=true&startkey="todo/"&endkey="todo0"', function() {
        this.storeBackend.findAll('todo');
        expect(this.hoodie.request).to.be.calledWith('GET', '/my%2Fstore/_all_docs?include_docs=true&startkey="todo%2F"&endkey="todo0"', { 'contentType': 'application/json' });

      });

      _and('prefix is "remote_prefix"', function() {
        beforeEach(function() {
          this.remote.prefix = 'remote_prefix/';
        });

        it('should send a GET to /_all_docs?include_docs=true&startkey="remote_prefix%2Ftodo%2F"&endkey="remote_prefix%2Ftodo0"', function() {
          this.storeBackend.findAll('todo');
          expect(this.hoodie.request).to.be.calledWith('GET', '/my%2Fstore/_all_docs?include_docs=true&startkey="remote_prefix%2Ftodo%2F"&endkey="remote_prefix%2Ftodo0"', { 'contentType': 'application/json' });
        });
      });
    }); // type is todo

    _when('request success', function() {

      beforeEach(function() {
        this.doc = {
          _id: 'car/fresh',
          createdAt: '2012-12-12T22:00:00.000Z',
          updatedAt: '2012-12-21T22:00:00.000Z'
        };
        this.requestDefer.resolve({
          total_rows: 3,
          offset: 0,
          rows: [
            {
              doc: this.doc
            }
          ]
        });
      });

      it('should be resolved with array of objects', function() {
        var object = {
          id: 'fresh',
          type: 'car',
          createdAt: '2012-12-12T22:00:00.000Z',
          updatedAt: '2012-12-21T22:00:00.000Z'
        };
        this.storeBackend.findAll().then(function (res) {
          expect(res).to.eql([object]);
        });
      });
    }); // request success

    _when('request has an error', function() {

      beforeEach(function() {
        this.requestDefer.reject('error');
      });

      it('should be rejected with the response error', function() {
        var promise = this.storeBackend.findAll();
        promise.fail(function (res) {
          expect(res).to.eql('error');
        });
      });
    }); // request has an error
  }); // #findAll

  describe('#save(type, id, object)', function() {

    it('should generate an id if it is undefined', function() {
      generateIdMock.reset();
      this.storeBackend.save({type: 'car'});
      expect(generateIdMock).to.be.called();
    });

    it('should not generate an id if id is set', function() {
      generateIdMock.reset();
      this.storeBackend.save({type: 'car', id: '123'});
      expect(generateIdMock).to.not.be.called();
    });

    it('should return promise by @request', function() {
      this.hoodie.request.returns('request_promise');
      expect(this.storeBackend.save('car', 123, {})).to.eql('request_promise');
    });

    _when('saving car/123 with color: red', function() {

      beforeEach(function() {
        this.storeBackend.save({
          type: 'car',
          id: '123',
          color: 'red'
        });

        var args = this.hoodie.request.args[0];
        this.type = args[0];
        this.path = args[1];
        this.data = JSON.parse(args[2].data);
      });

      it('should send a PUT request to `/my%2Fstore/car%2F123`', function() {
        expect(this.type).to.eql('PUT');
        expect(this.path).to.eql('/my%2Fstore/car%2F123');
      });

      it('should add type to saved object', function() {
        expect(this.data.type).to.eql('car');
      });

      it('should set _id to `car/123`', function() {
        expect(this.data._id).to.eql('car/123');
      });

      it('should not generate a _rev', function() {
        expect(this.data._rev).to.be(undefined);
      });
    }); // saving car/123 with color: red

    _when('saving car/123 with color: red and prefix is "remote_prefix"', function() {
      beforeEach(function() {

        this.remote.prefix = 'remote_prefix/';
        this.storeBackend.save({
          type: 'car',
          id: '123',
          color: 'red'
        });

        var args = this.hoodie.request.args[0];
        this.type = args[0];
        this.path = args[1];
        this.data = JSON.parse(args[2].data);
      });

      it('should send a PUT request to `/my%2Fstore/remote_prefix%2Fcar%2F123`', function() {
        expect(this.type).to.eql('PUT');
        expect(this.path).to.eql('/my%2Fstore/remote_prefix%2Fcar%2F123');
      });

      it('should set _id to `remote_prefix/car/123`', function() {
        expect(this.data._id).to.eql('remote_prefix/car/123');
      });
    }); // saving car/123 with color: red and prefix is 'remote_prefix'
  }); // #save

  describe('#remove(type, id)', function() {

    beforeEach(function() {
      this.remote.update.returns('update_promise');
    });

    it('should proxy to update with _deleted: true', function() {
      this.storeBackend.remove('car', 123);

      expect(this.remote.update.calledWith('car', 123, {
        _deleted: true
      })).to.be.ok();
    });

    it('should return promise of update', function() {
      expect(this.storeBackend.remove('car', 123)).to.eql('update_promise');
    });
  }); // #remove

  describe('#removeAll(type)', function() {
    beforeEach(function() {
      this.remote.updateAll.returns('updateAll_promise');
    });

    it('should proxy to updateAll with _deleted: true', function() {
      this.storeBackend.removeAll('car');
      expect(this.remote.updateAll.calledWith('car', {
        _deleted: true
      })).to.be.ok();
    });

    it('should return promise of updateAll', function() {
      expect(this.storeBackend.removeAll('car')).to.eql('updateAll_promise');
    });
  }); // #removeAll

  describe('#connect()', function() {
    beforeEach(function() {
      this.bootstrapDefer = this.hoodie.defer();
      this.sandbox.stub(this.remote, 'bootstrap').returns(this.bootstrapDefer);
      this.sandbox.spy(this.remote, 'push');
    });

    it('should set connected to true', function() {
      this.remote.connected = false;
      this.remote.connect();
      expect(this.remote.connected).to.eql(true);
    });

    it('should bootstrap', function() {
      this.remote.connect();
      expect(this.remote.bootstrap.called).to.be.ok();
    });

    it('triggers `connect` event', function() {
      this.remote.connect();
      expect(this.remote.trigger).to.be.calledWith('connect');
    });

    it('should set new name if passed as param', function() {
      this.remote.request('GET', '/funk');
      expect(this.hoodie.request).to.be.calledWith('GET', '/my%2Fstore/funk', { 'contentType': 'application/json' });
      this.remote.connect('funky/store');
      this.remote.request('GET', '/funk');
      expect(this.hoodie.request).to.be.calledWith('GET', '/funky%2Fstore/funk', { 'contentType': 'application/json' });
    });

    it('pushes after bootstrap finished', function() {
      this.remote.connect();
      expect(this.remote.push).to.not.be.called();
      this.bootstrapDefer.resolve([1,2,3]);
      expect(this.remote.push).to.be.calledWith();
    });
  }); // #connect

  describe('#disconnect()', function() {
    it('should abort the pull request', function() {
      var pullDeferPromise = this.hoodie.defer().promise();
      pullDeferPromise.abort = sinon.spy();
      this.sandbox.stub(this.remote, 'request').returns(pullDeferPromise);
      this.remote.pull();
      this.remote.disconnect();
      expect(pullDeferPromise.abort).to.be.called();
    });

    it('should abort the push request', function() {
      var pushDeferPromise = this.hoodie.defer().promise();
      pushDeferPromise.abort = sinon.spy();
      this.sandbox.stub(this.remote, 'request').returns(pushDeferPromise);
      this.remote.push([{type: 'funk'}]);
      this.remote.disconnect();
      expect(pushDeferPromise.abort).to.be.called();
    });
  }); // #disconnect

  describe('#getSinceNr()', function() {
    _when('since not set', function() {
      it('should return 0', function() {
        expect(this.remote._since).to.eql(void 0);
        expect(this.remote.getSinceNr()).to.eql(0);
      });
    });

    _when('since set to 100', function() {

      beforeEach(function() {
        this.remote = hoodieRemoteStore(this.hoodie, { since: 100 } );
      });

      it('should return 100', function() {
        expect(this.remote.getSinceNr()).to.eql(100);
      });
    });

    _when('since set to function', function() {
      beforeEach(function() {
        this.callback = function() { return 123; };
        this.remote = hoodieRemoteStore(this.hoodie, { since: this.callback } );
      });

      it('should return what the function returns', function() {
        expect(this.remote.getSinceNr()).to.eql(123);
      });
    });
  }); // #getSinceNr

  describe('#bootstrap()', function() {

    beforeEach(function() {
      this.bootstrapDefer = this.hoodie.defer();
      this.sandbox.stub(this.remote, 'pull').returns( this.bootstrapDefer );
    });

    it('should trigger bootstrap:start event', function() {
      this.remote.bootstrap();
      expect(this.remote.trigger.calledWith('bootstrap:start')).to.be.ok();
    });

    it('should pull', function() {
      this.remote.bootstrap();
      expect(this.remote.pull.called).to.be.ok();
    });

    it('should send a non-longpoll pull request', function() {
      this.sandbox.stub(this.remote, 'request').returns( this.bootstrapDefer );
      this.sandbox.stub(this.remote, 'isConnected').returns( true );
      this.remote.pull.restore();
      this.remote.bootstrap();
      expect(this.remote.request).to.be.calledWith('GET', '/_changes?include_docs=true&since=0');
    });

    _when('bootstrap succeeds', function() {
      beforeEach(function() {
        this.bootstrapDefer.resolve();
      });

      it('should trigger "bootstrap:end" event', function() {
        this.remote.bootstrap();
        expect(this.remote.trigger).to.be.calledWith('bootstrap:end');
      });
    });

    _when('bootstrap fails', function() {
      beforeEach(function() {
        this.bootstrapDefer.reject({message: 'bootstrapping aborted'});
      });

      it('should trigger "bootstrap:error" event', function() {
        this.remote.bootstrap();
        expect(this.remote.trigger).to.be.calledWith('bootstrap:error', {message: 'bootstrapping aborted'});
      });
    });
  }); // #bootstrap

  describe('#pull()', function() {

    beforeEach(function() {
      this.remote.connected = true;
      this.object1 = {
        type: 'todo',
        id: 'abc3',
        _rev: '2-123',
        _deleted: true
      };
      this.object2 = {
        type: 'todo',
        id: 'abc2',
        _rev: '1-123',
        content: 'remember the milk',
        done: false,
        order: 1
      };
      this.object3 = {
        type: 'todo',
        id: 'abc4',
        _rev: '4-123',
        content: 'I am prefixed yo.',
        done: false,
        order: 2
      };
      this.object4 = {
        id: 'abc5',
        type: 'todo',
        _rev: '5-123',
        content: 'deleted, but unknown',
        _deleted: true
      };

      this.requestDefer1 = this.hoodie.defer();
      this.requestDefer2 = this.hoodie.defer();
      this.promise1 = this.requestDefer1.promise();
      this.promise2 = this.requestDefer2.promise();
      this.promise1.abort = this.promise2.abort = sinon.spy();
      var defers = [this.promise1,this.promise2];
      this.sandbox.stub(this.remote, 'request', function() {
        return defers.shift();
      });
    });

    _when('.isConnected() is true', function() {

      beforeEach(function() {
        this.sandbox.stub(this.remote, 'isConnected').returns(true);
      });

      it('should send a longpoll GET request to the _changes feed', function() {
        var method, path, args;
        this.remote.pull();
        expect(this.remote.request.called).to.be.ok();

        args = this.remote.request.args[0], method = args[0], path = args[1];
        expect(method).to.eql('GET');
        expect(path).to.eql('/_changes?include_docs=true&since=0&heartbeat=10000&feed=longpoll');
      });

      it('restart pull after 25s', function() {

        this.remote.pull();
        this.sandbox.spy(this.remote, 'pull');
        expect(this.promise1.abort).to.not.be.called();
        this.clock.tick(25000);
        // it gets restarted when aborted
        expect(this.promise1.abort).to.be.called();
      });
    }); // .isConnected() is true

    _when('.isConnected() is false', function() {
      beforeEach(function() {
        this.sandbox.stub(this.remote, 'isConnected').returns(false);
      });

      it('should send a normal GET request to the _changes feed', function() {
        var method, path, args;

        this.remote.pull();
        expect(this.remote.request).to.be.called();
        args = this.remote.request.args[0];
        method = args[0];
        path = args[1];
        expect(method).to.eql('GET');
        expect(path).to.eql('/_changes?include_docs=true&since=0');
      });
    }); // .isConnected() is false

    _when('request is successful / returns changes', function() {

      beforeEach(function() {
        this.requestDefer1.resolve(this.FIXTURES.changesResponse());
      });

      it('should set since nr', function() {
        expect(this.remote.getSinceNr()).to.eql(0);
        this.remote.pull();
        expect(this.remote.getSinceNr()).to.eql(20);
      });

      it('should set since nr using callback if initialized with since callback', function() {
        var callback = sinon.spy();
        var remote = hoodieRemoteStore(this.hoodie, { name: 'my/store', since: callback} );
        var promise = this.hoodie.defer().resolve( this.FIXTURES.changesResponse() ).promise();
        this.sandbox.stub(remote, 'request').returns( promise );
        remote.pull();
        expect(callback).to.be.calledWith(20);
      });

      it('should trigger remote events', function() {
        this.sandbox.stub(this.remote, 'isKnownObject', function(object) {
          return object.id === 'abc3';
        });

        this.remote.pull();

        expect(this.remote.trigger).to.be.calledWith('remove', this.object1);
        expect(this.remote.trigger).to.be.calledWith('todo:remove', this.object1);
        expect(this.remote.trigger).to.be.calledWith('todo:abc3:remove', this.object1);
        expect(this.remote.trigger).to.be.calledWith('change', 'remove', this.object1);
        expect(this.remote.trigger).to.be.calledWith('todo:change', 'remove', this.object1);
        expect(this.remote.trigger).to.be.calledWith('todo:abc3:change', 'remove', this.object1);
        expect(this.remote.trigger).to.be.calledWith('add', this.object2);
        expect(this.remote.trigger).to.be.calledWith('todo:add', this.object2);
        expect(this.remote.trigger).to.be.calledWith('todo:abc2:add', this.object2);
        expect(this.remote.trigger).to.be.calledWith('change', 'add', this.object2);
        expect(this.remote.trigger).to.be.calledWith('todo:change', 'add', this.object2);
        expect(this.remote.trigger).to.be.calledWith('todo:abc2:change', 'add', this.object2);
        expect(this.remote.trigger).to.not.be.calledWith('todo:abc5:remove', this.object4);
      });

      _and('.isConnected() returns true', function() {
        beforeEach(function() {
          this.sandbox.spy(this.remote, 'pull');
          this.sandbox.stub(this.remote, 'isConnected').returns(true);
          this.remote.pull();
        });

        it('should pull again', function() {
          expect(this.remote.pull.callCount).to.be(2);
        });
      });

      _and('prefix is set', function() {

        beforeEach(function() {
          this.remote = hoodieRemoteStore(this.hoodie, {
            prefix: 'prefix/'
          } );
          this.sandbox.stub(this.remote, 'isConnected').returns(true);
          var defers = [this.promise1,this.promise2];
          this.sandbox.stub(this.remote, 'request', function() {
            return defers.shift();
          });
        });

        it('should trigger events only for objects with prefix', function() {
          this.remote.pull();
          expect(this.remote.trigger.calledWith('add', this.object3)).to.be.ok();
          expect(this.remote.trigger.calledWith('add', this.object2)).to.not.be.ok();
        });
      });

      _and('object has been returned before', function() {

        beforeEach(function() {
          this.sandbox.stub(this.remote, 'isKnownObject').returns(true);
          this.remote.pull();
        });

        it('should trigger update events', function() {
          var object = {
            'type': 'todo',
            id: 'abc2',
            _rev: '1-123',
            content: 'remember the milk',
            done: false,
            order: 1
          };
          expect(this.remote.trigger.calledWith('update', object)).to.be.ok();
        });

      });
    }); // request is successful / returns changes

    _when('request errors with 401 unauthorzied', function() {

      beforeEach(function() {
        this.requestDefer1.reject({status: 401}, 'error object');
        this.sandbox.spy(this.remote, 'disconnect');
      });

      it('should disconnect', function() {
        this.remote.pull();
        expect(this.remote.disconnect).to.be.called();
      });

      it('should trigger an unauthenticated error', function() {
        this.remote.pull();
        expect(this.remote.trigger).to.be.calledWith('error:unauthenticated', 'error object');
      });
    }); // request errors with 401 unauthorzied

    _when('request errors with 404 not found', function() {
      beforeEach(function() {
        this.sandbox.spy(global, 'setTimeout');
        this.requestDefer1.reject({status: 404}, 'error object');
      });

      it('should try again in 3 seconds (it might be due to a sign up, the userDB might be created yet)', function() {
        this.remote.pull();
        expect(global.setTimeout).to.be.calledWith(this.remote.pull, 3000);
      });
    }); // request errors with 404 not found

    _when('request errors with 500 oooops', function() {
      beforeEach(function() {
        this.sandbox.spy(global, 'setTimeout');
        this.requestDefer1.reject({status: 500}, 'error object');
      });

      it('should try again in 3 seconds (and hope it was only a hiccup ...)', function() {
        this.remote.pull();
        expect(global.setTimeout).to.be.calledWith(this.remote.pull, 3000);
      });

      it('should trigger a server error event', function() {
        this.remote.pull();
        expect(this.remote.trigger).to.be.calledWith('error:server', 'error object');
      });

      it('should check connection', function() {
        this.remote.pull();
        expect(this.hoodie.checkConnection).to.be.called();
      });
    }); // request errors with 500 oooops

    _when('request was aborted manually', function() {
      beforeEach(function() {
        this.sandbox.spy(global, 'setTimeout');
        this.requestDefer1.reject({statusText: 'abort'}, 'error object');
        this.sandbox.spy(this.remote, 'pull');
      });

      _and('is connected', function() {
        beforeEach(function() {
          this.sandbox.stub(this.remote, 'isConnected').returns(true);
          this.remote.pull();
        });

        it('should pull again', function() {
          expect(this.remote.pull.callCount).to.be(2);
        });
      });

      _and('is not connected', function() {
        beforeEach(function() {
          this.sandbox.stub(this.remote, 'isConnected').returns(false);
          this.remote.pull();
        });

        it('should pull again', function() {
          expect(this.remote.pull.callCount).to.be(1);
        });
      });
    }); // request was aborted manually

    _when('there is a different error', function() {

      beforeEach(function() {
        this.sandbox.spy(global, 'setTimeout');
        this.requestDefer1.reject({}, 'error object');
      });

      it('should try again in 3 seconds if .isConnected() returns false', function() {
        this.sandbox.stub(this.remote, 'isConnected').returns(true);

        this.remote.pull();

        expect(global.setTimeout.calledWith(this.remote.pull, 3000)).to.be.ok();
        global.setTimeout.reset();
        this.remote.isConnected.returns(false);
        this.remote.pull();

        expect(global.setTimeout.calledWith(this.remote.pull, 3000)).to.not.be.ok();
      });

      it('should check connection', function() {
        this.remote.pull();
        expect(this.hoodie.checkConnection.called).to.be.ok();
      });
    }); // there is a different error
  }); // #pull

  describe('#push(docs)', function() {
    beforeEach(function() {
      this.sandbox.stub(Date, 'now').returns(10);
      this.remote._timezoneOffset = 1;
    });

    _when('no docs passed', function() {
      it('shouldn\'t do anything', function() {
        this.remote.push();
        this.remote.push([]);

        expect(this.hoodie.request.called).to.not.be.ok();
      });
    }); // no docs passed

    _and('Array of docs passed', function() {
      beforeEach(function() {
        this.todoObjects = [
          {
            type: 'todo',
            id: '1'
          }, {
            type: 'todo',
            id: '2'
          }, {
            type: 'todo',
            id: '3'
          }
        ];
        this.promise = this.remote.push(this.todoObjects);
      });

      it('should return a promise', function() {
        expect(this.promise).to.have.property('done');
        expect(this.promise).to.not.have.property('resolved');
      });

      it('should POST the passed objects', function() {
        expect(this.hoodie.request.called).to.be.ok();
        var data = JSON.parse(this.hoodie.request.args[0][2].data);
        expect(data.docs.length).to.eql(3);
      });

      _when('push request succeeds', function() {
        beforeEach(function() {
          this.requestDefer.resolve();
        });

        it('should trigger push events for each object', function() {
          expect(this.remote.trigger).to.be.calledWith('push', { type: 'todo', id: '1', _rev: '1-uuid123' });
          expect(this.remote.trigger).to.be.calledWith('push', { type: 'todo', id: '2', _rev: '1-uuid123' });
          expect(this.remote.trigger).to.be.calledWith('push', { type: 'todo', id: '3', _rev: '1-uuid123' });
        });
      });
    }); // Array of docs passed

    _and('one deleted and one new doc passed', function() {
      beforeEach(function() {
        this.remote.push(this.FIXTURES.changedObjects());
        expect(this.hoodie.request.called).to.be.ok();
        var _ref = this.hoodie.request.args[0];

        this.method = _ref[0];
        this.path = _ref[1];
        this.data = JSON.parse(_ref[2].data);
      });

      it('should post the changes to the user\'s db _bulk_docs API', function() {
        expect(this.method).to.eql('POST');
        expect(this.path).to.eql('/my%2Fstore/_bulk_docs');
      });

      it('should send the docs in appropriate format', function() {
        var doc, docs;
        docs = this.data.docs;
        doc = docs[0];
        expect(doc.id).to.be(undefined);
        expect(doc._id).to.eql('todo/abc3');
        expect(doc._localInfo).to.be(undefined);
      });

      it('should set data.new_edits to false', function() {
        var new_edits;
        new_edits = this.data.new_edits;
        expect(new_edits).to.eql(false);
      });

      it('should set new _revision ids', function() {
        var deletedDoc, docs, newDoc;
        docs = this.data.docs;
        deletedDoc = docs[0];
        newDoc = docs[1];

        expect(deletedDoc._rev).to.eql('3-uuid123');
        expect(newDoc._rev).to.eql('1-uuid123');
        expect(deletedDoc._revisions.start).to.eql(3);
        expect(deletedDoc._revisions.ids[0]).to.eql('uuid123');
        expect(deletedDoc._revisions.ids[1]).to.eql('123');
        expect(newDoc._revisions.start).to.eql(1);
        expect(newDoc._revisions.ids[0]).to.eql('uuid123');
      });
    }); // one deleted and one new doc passed

    _and('prefix set to $public', function() {
      beforeEach(function() {
        this.remote.prefix = '$public/';
        this.todoObjects = [
          {
            type: 'todo',
            id: '1'
          }, {
            type: 'todo',
            id: '2'
          }, {
            type: 'todo',
            id: '3'
          }
        ];
        this.remote.push(this.todoObjects);
      });

      it('should prefix all document IDs with "$public/"', function() {
        expect(this.hoodie.request.called).to.be.ok();

        var data = JSON.parse(this.hoodie.request.args[0][2].data);
        expect(data.docs[0]._id).to.eql('$public/todo/1');
      });
    }); // prefix set to $public

    _and('_$local flags set', function() {
      beforeEach(function() {
        this.remote.prefix = '$public/';
        this.todoObjects = [
          {
            type: 'todo',
            id: '1'
          }, {
            type: 'todo',
            id: '2',
            _$local: true
          }
        ];
        this.remote.push(this.todoObjects);
      });

      it('should add `-local` suffix to rev number', function() {
        expect(this.hoodie.request).to.be.called();
        var data = JSON.parse(this.hoodie.request.args[0][2].data);
        expect(data.docs[0]._rev).to.eql('1-uuid123');
        expect(data.docs[1]._rev).to.eql('1-uuid123-local');
      });
    }); // _$local flags set
  }); // #push

  describe('#sync(docs)', function() {

    beforeEach(function() {
      this.pushDefer = this.hoodie.defer();
      this.sandbox.stub(this.remote, 'push').returns(this.pushDefer.promise());
      this.sandbox.spy(this.remote, 'pull');
      this.remote.sync([1, 2, 3]);
    });

    it('should push changes and pass arguments', function() {
      expect(this.remote.push.calledWith([1, 2, 3])).to.be.ok();
    });

    _when('push successful', function() {
      beforeEach( function() {
        this.pushDefer.resolve('hossa!');
      });

      it('should pull changes and pass arguments', function() {
        expect(this.remote.pull).to.be.calledWith('hossa!');
      });
    });
  }); // #sync
});
