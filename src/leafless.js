'use strict';

const http = require('http');
const fs = require('fs');
const url = require('url');
const crypto = require('crypto');
let path = require('path');

const mime = require('./mime');
const contentType = require('./tools/content-type');
const routing = require('./routing');
const tools = require('./tools');
const co = require('./tools/co');

const staticHandler = require('./defaulthandlers/static');

module.exports = (function () {
  let server = null;
  let bodyParser = null;

  return class LeafLess {
    constructor() {
      this.instanceID = crypto.randomBytes(5).toString('hex');
    }

    addBodyParse(fn) {
      if (!fn || !fn.call) {
        throw new Error(`bodyparse must be a function`);
      }
      bodyParser = fn;
    }

    handle(request, response, routed, url) {
      let context = this;

      let method = request.method.toLowerCase();
      let requestID = crypto.randomBytes(20).toString('hex');
      let handler = new routed.handler({
        reqID: requestID
      });

      if (handler[method] == undefined) {
        // method not supported
        tools.httpError(405, request, response);
        return void 0;
      }

      let ctxObject = {
        href: url.href,
        pathname: url.pathname,
        params: routed.params,
        query: url.query,

        requestHeaders() {
          return request.headers;
        },

        setHeader(key, value) {
          response.setHeader(key, value);
        },

        status(num) {
          if (typeof (num) !== 'number') {
            throw new Error('status code MUST be a number');
          }
          response.statusCode = num;
        },

        getBody() {
          return context.readHTTPBody(request);
        }
      };

      co.wrap(handler[method]).call(handler, ctxObject)
        .then(res => {
          this.sendResponse(res, response);
        })
        .catch(error => {
          // and error we don't know how to deal with
          console.error(error);
          process.exit(1);
        });
    }

    /**
     * read the body of the http request
     *
     * @param {Object} request - The request object from which we are reading the body
     */
    readHTTPBody(request) {
      return new Promise((resolve, reject) => {
        let buf = null;

        request.on('data', function (data) {
          buf = buf === null ? data : buf + data;
        });

        request.on('end', () => {
          if (buf === null) {
            resolve(null);
            return;
          }

          let parsedType = contentType.parse(request.headers['content-type']);

          if (parsedType.type === 'application/json') {
            let content = null;
            try {
              content = JSON.parse(buf.toString());
              resolve(content);
            } catch (e) {
              throw new Error(`error parsing json`);
            }
          } else {
            if (bodyParser !== null) {
              return resolve(bodyParser.call(null, buf));
            } else {
              resolve(buf);
            }
          }
        });
      });
    }

    /**
     * send back an http response to the client
     *
     * @param {any} value - the item being sent back as response
     * @param {Object} response - HTTPResponse object to which we are writing
     */
    sendResponse(value, response) {
      if (value == undefined) {
        response.end();
        return;
      }

      if (typeof (value) === 'object') {

        if (value.type && value.content) {
          response.setHeader('Content-Type', value.type);

          if (Buffer.isBuffer(value.content)) {
            response.end(value.content);
            return;
          }

          response.end(JSON.stringify(value.content));
          return;
        }

        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(value));
        return;
      }

      response.end(value);
    }

    /**
     * support serving static files
     * 
     * @param {string} path the url root to which to server static requests
     * @param {string} directory the directory from which to server static files
     * @param {Object} options any other options the might be set
     */
    static(urlPath, directory, options) {
      let route = this.route.bind(this);
      staticHandler({ route, urlPath, directory, options });
    }

    httpListener(request, response) {
      let reqUrl = `http://${request.headers.host}${request.url}`;
      let parseUrl = url.parse(reqUrl, true);
      let pathname = parseUrl.pathname;
      let routed = routing.get(pathname);

      if (routed.handler === null) {
        tools.httpError(404, request, response);
        return void 0;
      }

      this.handle(request, response, routed, parseUrl);
    }

    /**
     * set handlers of the given paths
      app.route('/:tool/:path', class ToolHandler {
        post(ctx) {
          return ctx.params;
        }
      });
    * @param {string} path - the url path being routed
    * @param {Object} handler - the route handler
    */
    route(path, handler) {
      if (typeof (path) === 'string') {
        if (typeof (handler) !== 'function') {
          throw new Error(`route is expecting handler to be a function found ${typeof (handler)}`);
        }

        routing.set(path, handler);
        return;
      }

      // if the first argument is an object
      // treat it like a key-value structure of path->handler
      if (typeof (path) === 'object') {
        for (let key of path) {
          if (path.hasOwnProperty(key)) {
            this.route(key, path[key]);
          }
        }
      }
    }

    getServer() {
      return server;
    }

    listen(...args) {
      // set up a http server and pass in the listener
      server = http.createServer(this.httpListener.bind(this));

      // log.info('starting up the server on port %s', HttpPort);
      server.listen(...args);
    }
  };
})();