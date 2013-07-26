describe("hoodie.request", function () {

  'use strict';

  beforeEach(function () {

    this.ajaxDefer = $.Deferred();
    var ajaxPromise = this.ajaxDefer.promise()
    ajaxPromise.abort = function() {}
    spyOn(window.jQuery, "ajax").andReturn(ajaxPromise);

    this.hoodie = new Mocks.Hoodie();
    hoodieRequest(this.hoodie)
    this.requestDefer = this.hoodie.defer();
  });

  // see http://bugs.jquery.com/ticket/14104
  it("should return a jQuery.ajax compatible promise", function() {
    var promise = this.hoodie.request('GET', '/');
    expect(promise).toBePromise();
    expect(promise.abort).toBeDefined();
  });

  _when("request('GET', '/')", function() {
    beforeEach(function() {
      var args;
      this.hoodie.request('GET', '/');
      this.args = args = $.ajax.mostRecentCall.args[0];
    });
    it("should send a GET request to http://my.cou.ch/", function() {
      expect(this.args.type).toBe('GET');
      expect(this.args.url).toBe('http://my.cou.ch/');
    });
    it("should set `dataType: 'json'", function() {
      expect(this.args.dataType).toBe('json');
    });
    it("should set `xhrFields` to `withCredentials: true`", function() {
      expect(this.args.xhrFields.withCredentials).toBe(true);
    });
    it("should set `crossDomain: true`", function() {
      expect(this.args.crossDomain).toBe(true);
    });
  });

  _when("request 'POST', '/test', data: funky: 'fresh'", function() {
    beforeEach(function() {
      var args;
      this.hoodie.request('POST', '/test', {
        data: {
          funky: 'fresh'
        }
      });
      this.args = args = $.ajax.mostRecentCall.args[0];
    });
    it("should send a POST request to http://my.cou.ch/test", function() {
      expect(this.args.type).toBe('POST');
      expect(this.args.url).toBe('http://my.cou.ch/test');
    });
  });

  _when("request('GET', 'http://api.otherapp.com/')", function() {
    beforeEach(function() {
      var args;
      this.hoodie.request('GET', 'http://api.otherapp.com/');
      this.args = args = $.ajax.mostRecentCall.args[0];
    });
    it("should send a GET request to http://api.otherapp.com/", function() {
      expect(this.args.type).toBe('GET');
      expect(this.args.url).toBe('http://api.otherapp.com/');
    });
  });
  _when("request fails with empty response", function() {
    beforeEach(function() {
      this.ajaxDefer.reject({
        xhr: {
          responseText: ''
        }
      });
    });
    it("should return a rejected promis with Cannot reach backend error", function() {
      expect(this.hoodie.request('GET', '/')).toBeRejectedWith({
        error: 'Cannot connect to Hoodie server at http://my.cou.ch'
      });
    });
  });
});

