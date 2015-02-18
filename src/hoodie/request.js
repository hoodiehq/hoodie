var extend = require('extend');
var utils = require('../utils');

var hoodiefyRequestErrorName = utils.hoodiefyRequestErrorName;
var getDefer = utils.promise.defer;
var rejectWith = utils.promise.rejectWith;

//
// hoodie.request
// ================

// Hoodie's central place to send request to its backend.
// At the moment, it's a wrapper around jQuery's ajax method,
// but we might get rid of this dependency in the future.
//
// It has build in support for CORS and a standard error
// handling that normalizes errors returned by CouchDB
// to JavaScript's native conventions of errors having
// a name & a message property.
//
// Common errors to expect:
//
// * HoodieRequestError
// * HoodieUnauthorizedError
// * HoodieConflictError
// * HoodieServerError
var exports = module.exports = function(hoodie) {
  //
  // public API
  //
  hoodie.request = exports.request.bind(null, hoodie);
};

// Hoodie backend listens to requests prefixed by /_api,
// so we prefix all requests with relative URLs

// Requests
// ----------

// sends requests to the hoodie backend.
//
//     promise = hoodie.request('GET', '/user_database/doc_id')
//
var API_PATH = '/_api';

exports.request = function(hoodie, type, url, options) {
  var defaults = {
    type: type,
    dataType: 'json'
  };
  var requestDefer = getDefer();
  var requestPromise = requestDefer.promise;
  var jQueryPromise;
  options = options || {};

  if (hoodie.account.bearerToken) {
    defaults.headers = {
      Authorization: 'Bearer ' + hoodie.account.bearerToken
    };
  }

  // if relative path passed, prefix with baseUrl
  if (!/^http/.test(url)) {
    url = (hoodie.baseUrl || '') + API_PATH + url;
  }

  // if url is cross domain, set CORS headers
  if (/^http/.test(url)) {
    defaults.xhrFields = {
      withCredentials: true
    };
    defaults.crossDomain = true;
  }

  defaults.url = url;

  // we are piping the result of the request to return a nicer
  // error if the request cannot reach the server at all.
  // We can't return the promise of ajax directly because of
  // the piping, as for whatever reason the returned promise
  // does not have the `abort` method any more, maybe others
  // as well. See also http://bugs.jquery.com/ticket/14104
  jQueryPromise = global.jQuery.ajax(extend(defaults, options))
    .done(requestDefer.resolve)
    .fail(requestDefer.reject);
  var pipedPromise = requestPromise.catch(exports.handleRequestError.bind(null, hoodie));
  pipedPromise.abort = jQueryPromise.abort;

  return pipedPromise;
};

//
//
//
exports.handleRequestError = function(hoodie, xhr) {
  var error;

  // handle manual abort of request
  if (xhr.statusText === 'abort') {

    return rejectWith({
      name: 'HoodieConnectionAbortError',
      message: 'Request has been aborted',
    });
  }

  try {
    error = exports.parseErrorFromResponse(xhr);
  } catch (_error) {

    if (xhr && xhr.responseText) {
      error = xhr.responseText;
    } else {
      error = {
        name: 'HoodieConnectionError',
        message: 'Could not connect to Hoodie server at {{url}}.',
        url: hoodie.baseUrl || '/'
      };
    }
  }

  return rejectWith(error);
};

//
// CouchDB returns errors in JSON format, with the properties
// `error` and `reason`. Hoodie uses JavaScript's native Error
// properties `name` and `message` instead, so we are normalizing
// that.
//
// Besides the renaming we also do a matching with a map of known
// errors to make them more clear. For reference, see
// https://wiki.apache.org/couchdb/Default_http_errors &
// https://github.com/apache/couchdb/blob/master/src/couchdb/couch_httpd.erl#L807
//

// map CouchDB HTTP status codes to Hoodie Errors
exports.HTTP_STATUS_ERROR_MAP = {
  400: 'HoodieRequestError', // bad request
  401: 'HoodieUnauthorizedError',
  403: 'HoodieRequestError', // forbidden
  404: 'HoodieNotFoundError', // forbidden
  409: 'HoodieConflictError',
  412: 'HoodieConflictError', // file exist
  500: 'HoodieServerError'
};

exports.parseErrorFromResponse = function(xhr) {
  var error = JSON.parse(xhr.responseText);
  // get error name
  error.name = exports.HTTP_STATUS_ERROR_MAP[xhr.status];

  if (!error.name) {
    error.name = hoodiefyRequestErrorName(error.error);
  }

  // store status & message
  error.status = xhr.status;
  error.message = error.reason || '';
  error.message = error.message.charAt(0).toUpperCase() + error.message.slice(1);

  // cleanup
  delete error.error;
  delete error.reason;

  return error;
};
