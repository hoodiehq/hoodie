/**
 * Serves static assets for Hoodie plugins
 *
 * This should be put before the API server since it is a subpath and should
 * match the request first.
 */

/* jshint unused:false*/

var connect = require('connect');
var dispatch = require('dispatch');
var path = require('path');
var _ = require('underscore');

var plugins = require('../core/plugins');

exports.metadata = function (config) {

  return Object.keys(config.plugins).map(function (id) {
    var meta = config.plugins[id].metadata;
    var name = meta.name.replace(/^hoodie-plugin-/, '');
    return {
      name: name,
      title: meta.title || name,
      description: meta.description,
      version: meta.version
    };
  });

};

exports.pockets = function (config) {

  return Object.keys(config.plugins).reduce(function (acc, id) {
    var plugin = config.plugins[id];
    var name = plugin.metadata.name.replace(/^hoodie-plugin-/, '');

      console.log(path.resolve(config.project_dir, 'node_modules', plugin.path, 'pocket'));


    acc[name] = connect.static(
      path.resolve(config.project_dir, 'node_modules', plugin.path, 'pocket')
    );
    return acc;
  }, {});

};

//module.exports = function (config) {

  //var metadata = Object.keys(config.plugins).map(function (id) {
    //var meta = config.plugins[id].metadata;
    //var name = meta.name.replace(/^hoodie-plugin-/, '');
    //return {
      //name: name,
      //title: meta.title || name,
      //description: meta.description,
      //version: meta.version
    //};
  //});

  //var pockets = Object.keys(config.plugins).reduce(function (acc, id) {
    //var plugin = config.plugins[id];
    //var name = plugin.metadata.name.replace(/^hoodie-plugin-/, '');
    //acc[name] = connect.static(
      //path.resolve(config.project_dir, 'node_modules', plugin.path, 'pocket')
    //);
    //return acc;
  //}, {});

  //function notFound(res) {
    //res.writeHead(404, {'Content-Type': 'text/html'});
    //res.end();
  //}

  //return dispatch({
    //'/_api/_plugins': {

      //'GET /?': function (req, res, next) {
        //// list all plugins and metadata
        //res.writeHead(200, {'Content-Type': 'application/json'});
        //res.end(JSON.stringify(metadata));
      //},

      //'GET /:name': function (req, res, next, name) {
        //// list single plugin metadata and config
        //var metaData = _.detect(metadata, function (doc) {
          //return doc.name === name;
        //});

        //if (!metaData) {
          //return notFound(res);
        //}
        //// clone the data because we're going to extend it with config
        //res.writeHead(200, {'Content-Type': 'application/json'});
        //res.end(JSON.stringify(metaData));
      //},

      //'GET /:name/pocket': function (req, res, next, name) {
        //// redirect to trailing slash version of url
        //res.writeHead(302, {'Location': req.url + '/'});
        //res.end();
      //},

      //'GET /:name/pocket/(.*)': function (req, res, next, name, path) {
        //// serve static assets for pocket
        //var w = pockets[name];

        //if (!w) {
          //return notFound(res);
        //}

        //req.url = '/' + path;

        //return w(req, res, function (err) {
          //if (err) {
            //return next(err);
          //}

          //return notFound(res);
        //});

      //}

    //}

  //});
//};
