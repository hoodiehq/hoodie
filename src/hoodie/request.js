var ajax = require('pouchdb-ajax');
var extend = require('extend');
var utils = require('../utils');

var hoodiefyRequestErrorName = utils.hoodiefyRequestErrorName;
var getDefer = utils.promise.defer;
var rejectWith = utils.promise.rejectWith;

//
// hoodie.request
// ================

// Hoodie's central place to send request to its backend.
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

exports.request = function(hoodie, method, url, options) {
  //passing in an XHR instance just lets us test it
  var defaults = {
    method: method,
    json: true
  };
  
  var requestDefer = getDefer();
  var requestPromise = requestDefer.promise;
  
  
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

  defaults.url = url;
  
  //passing `data` as an option is throughout the code
  if(options.data){
    options.body = options.data;
    delete options.data;
  }

  var ajaxRequest = ajax(extend(defaults, options), function(err, response, data){
    if(err){
      return requestDefer.reject(err);
    }
    requestDefer.resolve(response, data);
  });
  var promise = requestPromise.catch(exports.handleRequestError.bind(null, hoodie));
  
  promise.abort = ajaxRequest.abort;
  return promise;
};

//
//
//
exports.handleRequestError = function(hoodie, pouchError) {
  var error;

  // handle manual abort of request
  //I can't immediately see a way to port this
  //pouchdb-ajax doesn't expose the xhr or it's error
  //directly, and afaik it doesn't pass along any
  //means to direct an abort
  /*if (xhr.statusText === 'abort') {

    return rejectWith({
      name: 'HoodieConnectionAbortError',
      message: 'Request has been aborted',
    });
  }*/

  /*
  //see notes above parseErrorFromResponse function definition
  //at the end of the file
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
  }*/
  error = Object.create(pouchError);
  error.name = exports.HTTP_STATUS_ERROR_MAP[pouchError.status];;
  error.message = error.message.charAt(0).toUpperCase() + error.message.slice(1);
  
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


/**
 * pouch-ajax already parses the error and doesn't pass
 * along the xhr instance for us to be able to parse the
 * error here ourselves
 * so I'm not quite sure how to port this functionality over
 * without losing some of it
 */
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
