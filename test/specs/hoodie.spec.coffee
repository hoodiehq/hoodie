define 'specs/hoodie', ['hoodie'], (Hoodie) ->
  
  describe "Hoodie", ->
    beforeEach ->
      @app = new Hoodie 'http://couch.example.com'
      spyOn($, "ajax").andReturn $.Deferred()
    
    
    describe "new", ->
      it "should store the couchDB URL", ->
        app = new Hoodie 'http://couch.example.com'
        expect(app.base_url).toBe 'http://couch.example.com'
        
      it "should remove trailing slash from passed URL", ->
        app = new Hoodie 'http://couch.example.com/'
        expect(app.base_url).toBe 'http://couch.example.com'
    # /new
    
    describe "request(type, path, options)", ->
      _when "request('GET', '/')", ->
        beforeEach ->
          @app.request('GET', '/')
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
          expect(@app.request('GET', '/')).toBe promise
      
      _when "request 'POST', '/test', data: funky: 'fresh'", ->
        beforeEach ->
          @app.request 'POST', '/test', data: funky: 'fresh'
          @args = args = $.ajax.mostRecentCall.args[0]
          
        it "should send a POST request to http://couch.example.com/test", ->
          expect(@args.type).toBe 'POST'
          expect(@args.url).toBe 'http://couch.example.com/test'
        
    # /request(type, path, options)
  # /Hoodie