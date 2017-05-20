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
    });
  });
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

module.exports = function makectx(
  request: IncomingMessage,
  response: ServerResponse,
  routed: any,
  URL: any
) {
  let ctx = {
    host: request.headers.host,
    url: request.url,
    params: routed.params,
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
    },

    /**
     * read a file and send back the contents in the request
     * @param  {string} pathname absolute path to the file we are looking for
     */
    readFile(pathname: string) {
      return readFile(pathname).then(content => {
        let type = mime.lookup(pathname);
        return { type, content }
      })
    }
  };

  return ctx;
};
