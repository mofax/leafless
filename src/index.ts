"use strict";

import * as http from "http";
import * as https from "https";
import * as parseurl from "parseurl";
import stoppable from "./stoppable";
import { Handler, routing } from "./routing";
import { CTX, makectx } from "./makectx";

/**
 * httpListener is passed into http.createServer
 * @param {IncomingMessage} request http.ServerRequest
 * @param {ServerResponse} response http.ServerResponse
 */
function httpListener(
  request: http.IncomingMessage,
  response: http.ServerResponse
) {
  const URL = parseurl(request);
  let ctx: CTX,
    method: string,
    handler: Handler,
    routed = routing.get(URL.pathname);

  // check 404s
  if (routed.handler == null) {
    response.statusCode = 404;
    return response.end("Not Found");
  }
  ctx = makectx(request, response, routed, URL);
  method = request.method.toLowerCase();
  handler = routed.handler;

  // check 405 Method Not Supported
  if (handler[method] == undefined) {
    response.statusCode = 405;
    return response.end("Method Not Supported");
  }
  handler[method]
    .call(handler, ctx)
    .then(() => {})
    .catch((error: Error) => {
      // an error we don't know how to deal with
      console.error(error);
      process.exit(1);
    });
}

class LeafLess {
  options: any;
  server: http.Server | https.Server;
  constructor(options = {}) {
    this.options = options;
  }

  listen(...args: any[]) {
    let options = this.options,
      instance = this;

    // set up a http server and pass in the listener
    if (options.ssl) {
      let server = https.createServer(options.ssl, httpListener.bind(instance));
      let st = stoppable(server);
      instance.server = st;
    } else {
      instance.server = stoppable(
        http.createServer(httpListener.bind(instance))
      );
    }
    instance.server = instance.server.listen(...args);
    return instance.server;
  }

  /**
   * route sets handlers of the given paths
    route('/:tool/:path', {
      async post(ctx) {
        return ctx.params;
      }
    });

  * @param {string} path the url path being routed
  * @param {Object} handler the route handler
  */
  route(path: string, handler: Handler) {
    if (typeof path === "string") {
      if (Array.isArray(handler)) throw new Error(`handler can't be an array`);
      if (typeof handler === "object") return routing.set(path, handler);

      throw new Error(
        `route is expecting handler to be of handler type found '${typeof handler}'`
      );
    }
  }
}

export default LeafLess;
