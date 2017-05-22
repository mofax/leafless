"use strict";

const http = require("http");
const https = require("https");
const parseurl = require("parseurl");
const routing = require("./routing");
const makectx = require("./makectx");

/**
* httpListener is passed into http.createServer
* @param {ClientRequest} request http.ServerRequest
* @param {ServerResponse} response http.ServerResponse
*/
function httpListener(request, response) {

  const URL = parseurl(request);
  let ctx, method, handler, routed = routing.get(URL.pathname);

  // check 404s
  if (routed.handler == null) {
    response.statusCode = 404;
    return response.end("Not Found");
  }
  ctx = makectx(request, response, routed, URL);
  method = request.method.toLowerCase();
  handler = routed.handler;
  if (typeof routed.handler === "function") handler = new routed.handler({});

  // check 405 Method Not Supported
  if (handler[method] == undefined) {
    response.statusCode = 405;
    return response.end("Method Not Supported");
  }
  handler[method].call(handler, ctx).then(res => {}).catch(error => {
    // and error we don't know how to deal with
    console.error(error);
    process.exit(1);
  });
}

function LeafLess(options = {}) {
  let instance;
  if (!(this instanceof LeafLess)) return new LeafLess(options);
  instance = this;

  instance.options = options;

  instance.listen = function(...args) {
    // set up a http server and pass in the listener
    if (options.ssl) {
      instance.server = https.createServer(
        options.ssl,
        httpListener.bind(instance)
      );
    } else {
      instance.server = http.createServer(httpListener.bind(instance));
    }
    instance.server.listen(...args);
    return instance.server;
  };

  /**
   * route sets handlers of the given paths
    route('/:tool/:path', {
      *post(ctx) {
        return ctx.params;
      }
    });

  * @param {string} path the url path being routed
  * @param {Object} handler the route handler
  */
  instance.route = function(path, handler) {
    if (typeof path === "string") {
      if (Array.isArray(handler)) throw new Error(`handler can't be an array`);
      if (typeof handler === "function" || typeof handler === "object")
        return routing.set(path, handler);

      throw new Error(
        `route is expecting handler to be a function or object found '${typeof handler}'`
      );
    }
  };

  return instance;
}

module.exports = LeafLess;