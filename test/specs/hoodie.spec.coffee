describe "Hoodie", ->
  beforeEach ->
    @hoodie = new Hoodie 'http://couch.example.com'
    @ajaxDefer = $.Deferred()
    spyOn($, "ajax").andReturn @ajaxDefer.promise()
    spyOn(window, "setTimeout").andCallFake (cb) -> cb


  describe "constructor", ->
    it "should store the CouchDB URL", ->
      hoodie = new Hoodie 'http://couch.example.com'
      expect(hoodie.baseUrl).toBe 'http://couch.example.com'
      
    it "should remove trailing slash from passed URL", ->
      hoodie = new Hoodie 'http://couch.example.com/'
      expect(hoodie.baseUrl).toBe 'http://couch.example.com'
      
    it "should default the CouchDB URL to current domain with a api subdomain", ->
      # that's kind of hard to test.
      hoodie = new Hoodie
      expect(hoodie.baseUrl).toBe "/_api"

    it "should check connection", ->
      spyOn(Hoodie::, "checkConnection")
      hoodie = new Hoodie
      expect(Hoodie::checkConnection).wasCalled()

    it "store has to be initialized before remote", ->
      # because RemoteAccount bootstraps known objects using
      # hoodie.store.index() in its constructor
      order = []
      spyOn(Hoodie, "LocalStore").andCallFake ->
        order.push('store')
        return new Mocks.Hoodie().store
      spyOn(Hoodie, "AccountRemote").andCallFake ->
        order.push('remote')
        return new Mocks.Hoodie().remote

      hoodie = new Hoodie
      expect(order.join(',')).toBe 'store,remote'
  # /constructor
  

  describe "#request(type, path, options)", ->
    _when "request('GET', '/')", ->
      beforeEach ->
        @hoodie.request('GET', '/')
        @args = args = $.ajax.mostRecentCall.args[0]
        
      it "should send a GET request to http://couch.example.com/", ->
        expect(@args.type).toBe 'GET'
        expect(@args.url).toBe 'http://couch.example.com/'
      
      it "should set `dataType: 'json'", ->
        expect(@args.dataType).toBe 'json'
        
      it "should set `xhrFields` to `withCredentials: true`", ->
        expect(@args.xhrFields.withCredentials).toBe true
      
      it "should set `crossDomain: true`", ->
        expect(@args.crossDomain).toBe true
      
      it "should return a promise", ->
        expect(@hoodie.request('GET', '/')).toBePromise()
         
    
    _when "request 'POST', '/test', data: funky: 'fresh'", ->
      beforeEach ->
        @hoodie.request 'POST', '/test', data: funky: 'fresh'
        @args = args = $.ajax.mostRecentCall.args[0]
        
      it "should send a POST request to http://couch.example.com/test", ->
        expect(@args.type).toBe 'POST'
        expect(@args.url).toBe 'http://couch.example.com/test'

    _when "request('GET', 'http://api.otherapp.com/')", ->
      beforeEach ->
        @hoodie.request('GET', 'http://api.otherapp.com/')
        @args = args = $.ajax.mostRecentCall.args[0]

      it "should send a GET request to http://api.otherapp.com/", ->
        expect(@args.type).toBe 'GET'
        expect(@args.url).toBe 'http://api.otherapp.com/'

    _when "request fails with empty response", ->
      beforeEach ->
        @ajaxDefer.reject({ xhr: {responseText: ''}})
      
      xit "should return a rejected promis with Cannot reach backend error", ->
        expect(@hoodie.request('GET', '/')).toBeRejectedWith error: 'Cannot connect to backend at http://couch.example.com'
         
      
  # /request(type, path, options)


  describe "#checkConnection()", ->
    beforeEach ->
      @requestDefer = @hoodie.defer() 
      @hoodie._checkConnectionRequest = null
      spyOn(@hoodie, "request").andReturn @requestDefer.promise()
      spyOn(@hoodie, "trigger")
      window.setTimeout.andReturn null # prevent recursion
    
    it "should send GET / request", ->
      @hoodie.checkConnection()
      expect(@hoodie.request).wasCalledWith 'GET', '/'

    it "should only send one request at a time", ->
      @hoodie.checkConnection()
      @hoodie.checkConnection()
      expect(@hoodie.request.callCount).toBe 1

    _when "hoodie is online", ->
      beforeEach ->
        @hoodie.online = true

      _and "request succeeds", ->
        beforeEach ->
          @requestDefer.resolve {"couchdb":"Welcome","version":"1.2.1"}
          @hoodie.checkConnection()

        it "should check again in 30 seconds", ->
          expect(window.setTimeout).wasCalledWith @hoodie.checkConnection, 30000

        it "should not trigger `reconnected` event", ->
          expect(@hoodie.trigger).wasNotCalledWith 'reconnected'

      _and "request fails", ->
        beforeEach ->
          @requestDefer.reject {"status": 0,"statusText":"Error"}
          @hoodie.checkConnection()

        it "should check again in 3 seconds", ->
          expect(window.setTimeout).wasCalledWith @hoodie.checkConnection, 3000

        it "should trigger `disconnected` event", ->
          expect(@hoodie.trigger).wasCalledWith 'disconnected'

    _when "hoodie is offline", ->
      beforeEach ->
        @hoodie.online = false

      _and "request succeeds", ->
        beforeEach ->
          @requestDefer.resolve {"couchdb":"Welcome","version":"1.2.1"}
          @hoodie.checkConnection()

        it "should check again in 30 seconds", ->
          expect(window.setTimeout).wasCalledWith @hoodie.checkConnection, 30000

        it "should trigger `reconnected` event", ->
          expect(@hoodie.trigger).wasCalledWith 'reconnected'

      _and "request fails", ->
        beforeEach ->
          @requestDefer.reject {"status": 0,"statusText":"Error"}
          @hoodie.checkConnection()

        it "should check again in 3 seconds", ->
          expect(window.setTimeout).wasCalledWith @hoodie.checkConnection, 3000

        it "should not trigger `disconnected` event", ->
          expect(@hoodie.trigger).wasNotCalledWith 'disconnected'
  # /#checkConnection()

  describe "#open(store, options)", ->
    it "should instantiate a Remote instance", ->
      spyOn(Hoodie, "Remote")
      @hoodie.open "store_name", option: "value"
      expect(Hoodie.Remote).wasCalledWith @hoodie, name: "store_name", option: "value"
  # /open(store, options)


  describe "#uuid(num = 7)", ->
    it "should default to a length of 7", ->
      expect(@hoodie.uuid().length).toBe 7
    
    _when "called with num = 5", ->
      it "should generate an id with length = 5", ->
        expect(@hoodie.uuid(5).length).toBe 5
  # /#uuid(num)


  describe "#isPromise(object)", ->
    it "should return true if object is a promise", ->
      object = $.Deferred().promise()
      expect( @hoodie.isPromise(object) ).toBe true

    it "should return false for deferred objects", ->
      object = $.Deferred()
      expect( @hoodie.isPromise(object) ).toBe false

    it "should return false when object is undefined", ->
      expect( @hoodie.isPromise(undefined) ).toBe false
  # /#isPromise()

  describe "#resolve()", ->
    it "simply returns resolved promise", ->
       expect(@hoodie.resolve()).toBeResolved()

    it "should be applyable", ->
      promise = @hoodie.reject().then( null, @hoodie.resolve )
      expect(promise).toBeResolved()
  # /#resolveWith(something)

  describe "#reject()", ->
    it "simply returns rejected promise", ->
      expect(@hoodie.reject()).toBeRejected()

    it "should be applyable", ->
      promise = @hoodie.resolve().then( @hoodie.reject )
      expect(promise).toBeRejected()
  # /#resolveWith(something)

  describe "#resolveWith(something)", ->
    it "wraps passad arguments into a promise and returns it", ->
       promise = @hoodie.resolveWith('funky', 'fresh')
       expect(promise).toBeResolvedWith 'funky', 'fresh'

    it "should be applyable", ->
      promise = @hoodie.rejectWith(1, 2).then( null, @hoodie.resolveWith )
      expect(promise).toBeResolvedWith 1, 2
  # /#resolveWith(something)

  describe "#rejectWith(something)", ->
    it "wraps passad arguments into a promise and returns it", ->
       promise = @hoodie.rejectWith('funky', 'fresh')
       expect(promise).toBeRejectedWith 'funky', 'fresh'

    it "should be applyable", ->
      promise = @hoodie.resolveWith(1, 2).then( @hoodie.rejectWith )
      expect(promise).toBeRejectedWith 1, 2
  # /#rejectWith(something)

  describe "#dispose()", ->
    beforeEach ->
      spyOn(@hoodie, "trigger")
    
    it "should trigger `dispose` event", ->
      @hoodie.dispose() 
      expect(@hoodie.trigger).wasCalledWith 'dispose'
  # /#dispose()
# /Hoodie