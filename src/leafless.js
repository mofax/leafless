'use strict';

const http = require('http');
const fs = require('fs');
const url = require('url');
const crypto = require('crypto');
let path = require('path');

const mime = require('./mime');
const contentType = require('./content-type');
const routing = require('./routing');
const tools = require('./tools');

let server = null;

module.exports = class LeafLess {
  constructor() {
    this.instanceID = crypto.randomBytes(5).toString('hex');
  }

  handle(request, response, routed, url) {
    let context = this;

    let method = request.method.toLowerCase();
    let requestID = crypto.randomBytes(20).toString('hex');
    let handler = new routed.handler({
      reqID: requestID
    });

    if (typeof (handler[method]) !== 'function') {
      // method not supported
      console.log(method);
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

    let call = handler[method].call(handler, ctxObject); // expecting call to be from a generator function

    this.dealWithMethodIterator(call, response, handler, ctxObject);
  }

  dealWithMethodIterator(iter, response, handler, ctx, passIn = {}) {
    if (typeof (iter.next) !== 'function') {
      throw new Error('expecting method handler to return an iterator');
    }

    let ite;
    if ((typeof(passIn) === 'object') && (passIn.hasOwnProperty('done')) && (passIn.hasOwnProperty('value'))) {
      ite = passIn;
    } else {
      ite = iter.next(passIn);
    }

    if (ite.done === true) {
      this.sendResponse(ite.value, response);
      return;
    }

    if ((ite.value instanceof Promise)) {
      ite.value.then(res => {
        this.dealWithMethodIterator(iter, response, handler, ctx, res);
      }).catch(err => {
        let errorResponse = iter.throw(err);
        this.dealWithMethodIterator(iter, response, handler, ctx, errorResponse);
      });
    } else {
      this.dealWithMethodIterator(iter, response, handler, ctx, ite.value);
    }
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
            throw new Error('currently able to work with application/json');
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
   * set handlers of the given paths
   *app.route('/:tool/:path', class ToolHandler {
  *post(ctx) {
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

  /**
   * support serving static files
   * 
   * @param {string} path the url root to which to server static requests
   * @param {string} directory the directory from which to server static files
   * @param {Object} options any other options the might be set
   */
  static(urlPath, directory, options) {
    let route = this.route.bind(this);

    let pathAsterix = `${urlPath}/*`;

    class StaticHandler {

      /**
       * read a file from the file system; checks for mime type too
       */
      getFile(dir, _path) {
        return new Promise((resolve, reject) => {
          let fetch = path.join(dir, _path);
          if (!path.isAbsolute(fetch)) {
            fetch = path.join(process.cwd(), fetch);
          }

          fs.readFile(fetch, (err, content) => {
            if (err) {
              return reject(err);
            }

            let type = mime.lookup(fetch);
            resolve({ type, content });
          });
        });
      }

      *get(ctx) {
        try {
          let pathSplit = ctx.pathname.split(urlPath);
          let findFile = (pathSplit[1] === '/' || pathSplit[1] === '') ? '/index.html' : pathSplit[1];

          let contents = yield this.getFile(directory, findFile);
          return contents;
        } catch (err) {
          if (err.code === 'ENOENT') {
            // 404
            ctx.status(404);
            return { type: 'text/plain', content: Buffer.from('file not found') };
          } else {
            ctx.status(500);
            return { type: 'text/plain', content: Buffer.from('internal server error') };
            console.error(err);
          }
        }
      }
    }

    route(urlPath, StaticHandler);
    route(pathAsterix, StaticHandler);
  }

  listen(port) {
    // set up a http server and pass in the listener
    server = http.createServer(this.httpListener.bind(this));

    // log.info('starting up the server on port %s', HttpPort);
    server.listen(port);
  }
};
