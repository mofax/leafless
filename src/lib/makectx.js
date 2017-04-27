// @flow
import type { IncomingMessage, ServerResponse } from "http";

let querystring = require("querystring");
let fs = require("fs");

let mime = require("../vendor/mime");

function readFile(filename: string) {
  return new Promise(resolve => {
    fs.readFile(filename, (err, data) => {
      if (err) throw err;
      resolve(data);
    })
  })
}

function readHTTPBody(request) {
  return new Promise(resolve => {
    let buf = null;
    request.on("data", data => {
      buf = buf === null ? data : buf + data;
    });

    request.on("end", e => {
      resolve(buf);
    });
  });
}

/**
 * send back an http response to the client
 *
 * @param {any} value - the item being sent back as response
 * @param {Object} response - HTTPResponse object to which we are writing
 */
function sendResponse(value: any, response: ServerResponse) {
  if (value == undefined) return response.end();
  // did we get an object?
  if (typeof value === "object") {
    if (value.type && value.content) {
      response.setHeader("Content-Type", value.type);
      if (Buffer.isBuffer(value.content)) return response.end(value.content);

      return response.end(JSON.stringify(value.content));
    }
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(value));
    return;
  }
  // return as is
  response.end(value);
}

module.exports = function makectx(
  request: IncomingMessage,
  response: ServerResponse,
  routed: any,
  URL: any
) {
  let ctx = {
    host: request.headers.host,
    url: request.url,
    pathname: URL.pathname,
    params: routed.params || {},
    query: querystring.parse(URL.query),
  };

  ctx.request = {};
  ctx.response = {};

  ctx.request.getHeaders = function () {
    return request.headers;
  },

  ctx.request.getBody = function () {
    return readHTTPBody(request);
  },

  ctx.response.setHeader = function (key: string, value: string) {
    response.setHeader(key, value);
  },

  ctx.response.setStatus = function (num: number) {
    if (typeof num !== "number") {
      throw new Error("status code MUST be a number");
    }
    response.statusCode = num;
  },

  ctx.response.sendFile = function (filename: string) {
    return readFile(filename).then(content => {
      let type = mime.lookup(filename);
      ctx.end({ type, content })
    }).catch(err => {
      if (err.code === "ENOENT") {
        // 404
        ctx.response.setStatus(404);
        ctx.end("file not found");
      } else {
        console.error(err);
        ctx.response.setStatus(500);
        ctx.end("internal server error");
      }
    })
  }
  // end
  ctx.end = function (res: any) {
    sendResponse(res, response);
  }

  return ctx;
};
