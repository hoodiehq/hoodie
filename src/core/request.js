//
// hoodie.request (dreamcode)
// ============================

// I'd like to modularize hoodie.js for simpler testing
// and a better overview. This is just an attempt to do
// so, I'm very open for other suggestions.
//
// If possible, I'd like to avoid to use one of the common
// module loaders, but be agnostic to them.
//
Hoodie.extend('request', function requestFactory(hoodie) {

  'use strict';

  // Requests
  // ----------

  // sends requests to the hoodie backend.
  //
  //     promise = hoodie.request('GET', '/user_database/doc_id')
  //
  function request(type, url, options) {
    var defaults, requestPromise, pipedPromise;

    options = options || {};

    // if a relative path passed, prefix with @baseUrl
    if (!/^http/.test(url)) {
      url = "" + hoodie.baseUrl + url;
    }

    defaults = {
      type: type,
      url: url,
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      dataType: 'json'
    };

    // we are piping the result of the request to return a nicer
    // error if the request cannot reach the server at all.
    // We can't return the promise of ajax directly because of
    // the piping, as for whatever reason the returned promise
    // does not have the `abort` method any more, maybe others
    // as well. See also http://bugs.jquery.com/ticket/14104
    requestPromise = $.ajax($.extend(defaults, options));
    pipedPromise = requestPromise.then( null, pipeRequestError);
    pipedPromise.abort = requestPromise.abort;

    return pipedPromise;
  }

  //
  //
  //
  function pipeRequestError(xhr) {
    var error;

    try {
      error = JSON.parse(xhr.responseText);
    } catch (_error) {
      error = {
        error: xhr.responseText || ("Cannot connect to Hoodie server at " + hoodie.baseUrl)
      };
    }

    return hoodie.rejectWith(error).promise();
  }


  //
  // public API
  //
  return {
    request: request
  };
});
