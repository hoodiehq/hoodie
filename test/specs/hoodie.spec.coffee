describe "Hoodie", ->
  beforeEach ->
    @hoodie = new Hoodie 'http://couch.example.com'
    spyOn($, "ajax").andReturn $.Deferred()
  
  
  describe "constructor", ->
    it "should store the CouchDB URL", ->
      hoodie = new Hoodie 'http://couch.example.com'
      expect(hoodie.baseUrl).toBe 'http://couch.example.com'
      
    it "should remove trailing slash from passed URL", ->
      hoodie = new Hoodie 'http://couch.example.com/'
      expect(hoodie.baseUrl).toBe 'http://couch.example.com'
      
    it "should default the CouchDB URL to ''", ->
      hoodie = new Hoodie
      expect(hoodie.baseUrl).toBe ''
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
        promise = $.Deferred()
        $.ajax.andReturn promise
        expect(@hoodie.request('GET', '/')).toBe promise
    
    _when "request 'POST', '/test', data: funky: 'fresh'", ->
      beforeEach ->
        @hoodie.request 'POST', '/test', data: funky: 'fresh'
        @args = args = $.ajax.mostRecentCall.args[0]
        
      it "should send a POST request to http://couch.example.com/test", ->
        expect(@args.type).toBe 'POST'
        expect(@args.url).toBe 'http://couch.example.com/test'
  # /request(type, path, options)

  describe "#open(store, options)", ->
    it "should instantiate a RemoteStore instance", ->
      spyOn(Hoodie, "RemoteStore")
      @hoodie.open "store_name", option: "value"
      expect(Hoodie.RemoteStore).wasCalledWith @hoodie, name: "store_name", option: "value"
  # /open(store, options)

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
# /Hoodie