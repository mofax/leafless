'use strict';

const http = require('http');
const url = require('url');
const crypto = require('crypto');

const routing = require('./routing');

let server = null;

module.exports = class LeafLess {
    constructor() {
        this.instanceID = crypto.randomBytes(20).toString('hex');
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
            this.emit('HTTP404');
            return void 0;
        }

        let ctxObject = {
            href: url.href,
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

        let call = handler[method].call(null, ctxObject); // expecting call to be an iterable

        this.dealWithMethodIterator(call, response, handler);
    }

    dealWithMethodIterator(iter, response, handler, passIn) {
        if (typeof (iter.next) !== 'function') {
            throw new Error('expecting method handler to return an iterator');
        }

        let ite = iter.next(passIn);
        if (ite.done === true) {
            this.sendResponse(ite.value, response);
            return;
        }

        if ((ite.value instanceof Promise)) {
            ite.value.then(res => {
                this.dealWithMethodIterator(iter, response, handler, res);
            }).catch(err => {
                this.dealWithMethodIterator(handler.catch(err), response, handler);
            });
        }
    }

    httpListener(request, response) {
        let reqUrl = `http://${request.headers.host}${request.url}`;
        let parseUrl = url.parse(reqUrl, true);
        let pathname = parseUrl.pathname;
        let routed = routing.hash.get(pathname);

        if (routed.handler === null) {
            throw new Error('handler not found');
            // return void 0;
        }

        this.handle(request, response, routed, parseUrl);
    }

    /**
     * readHTTPBody - read the body of the http request
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

                let contentType = request.headers['content-type'];

                if (contentType === 'application/json') {
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
     * sendResponse - send back an http response to the client
     * 
     * @param {any} value - the item being sent back as response
     * @param {Object} response - HTTPResponse object to which we are writing
     */
    sendResponse(value, response) {
        if (value === undefined || value === null) {
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
     * route - set handlers of the given paths
     */
    route(path, handler) {
        if (typeof (path) === 'string') {
            if (typeof (handler) !== 'function') {
                throw new Error(`route is expecting handler to be a function found ${typeof (handler)}`);
            }

            routing.hash.set(path, handler);
            return;
        }

        if (typeof (path) === 'object') {
            for (let key of path) {
                if (path.hasOwnProperty(key)) {
                    this.route(key, path[key]);
                }
            }
        }
    }

    listen(port) {
        // set up a http server and pass in the listener
        server = http.createServer(this.httpListener.bind(this));

        // log.info('starting up the server on port %s', HttpPort);
        server.listen(port);
    }
};