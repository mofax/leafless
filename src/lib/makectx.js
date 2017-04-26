// @flow
import type { IncomingMessage, ServerResponse } from "http";

let querystring = require("querystring");

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

    getRequestHeaders() {
      return request.headers;
    },

    setHeader(key: string, value: string) {
      response.setHeader(key, value);
    },

    setStatus(num: number) {
      if (typeof num !== "number") {
        throw new Error("status code MUST be a number");
      }
      response.statusCode = num;
    },

    getBody() {
      return readHTTPBody(request);
    }
  };

  return ctx;
};
