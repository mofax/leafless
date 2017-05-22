"use strict";

let querystring = require("querystring");
let fs = require("fs");

let send = require("send");
let body = require("./body");

let { streamFile } = require("./util");

module.exports = function makectx(request, response, routed, URL) {
  let ctx = {
    _req: request,
    _res: response,
    host: request.headers.host,
    url: request.url,
    params: routed.params,
    query: querystring.parse(URL.query),

    request: {},
    response: {}
  };

  ctx.request.headers = () => {
    return request.headers;
  };

  ctx.response.setHeader = (key, value) => {
    response.setHeader(key, value);
  };

  ctx.response.status = num => {
    if (typeof num !== "number") {
      throw new Error("status code MUST be a number");
    }
    response.statusCode = num;
  };

  ctx.response.sendFile = path => {
    streamFile(path, response);
  };

  body.request(ctx.request, request);
  body.response(ctx.response, response);
  return ctx;
};
