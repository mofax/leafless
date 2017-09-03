"use strict";

import { IncomingMessage, ServerResponse } from "http";

/**
 * a function that waits on the data on http body to be read
 * @param req http request object
 */
function wait(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let buf: Buffer = null;

    req.on("data", (chunk: Buffer) => {
      if (buf === null) {
        buf = chunk;
        return;
      }
      buf = Buffer.concat([buf, chunk]);
    });

    req.on("end", () => {
      resolve(buf);
    });
  });
}

/**
 * helper function to add helper methods to ctx.request
 * @param ctx the context object
 * @param req http incoming request
 */
export function request(ctx: any, req: IncomingMessage) {
  ctx.json = async function json() {
    let data = await wait(req);
    return JSON.parse(data.toString());
  };

  ctx.text = async function text() {
    let data = await wait(req);
    return data.toString();
  };

  ctx.buffer = async function buf() {
    return await wait(req);
  };
}

/**
 * helper function to add helper methods to ctx.response
 * @param ctx the ctx object
 * @param res the http response object
 */
export function response(ctx: any, res: ServerResponse) {
  ctx.json = async function json(body: any) {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };

  ctx.text = async function text(body: Buffer | string) {
    res.setHeader("Content-Type", "text/plain");
    res.end(body.toString());
  };

  ctx.buffer = async function buf(body: Buffer) {
    if (Buffer.isBuffer(body)) {
      res.end(body);
    } else {
      throw new Error(`response.buffer expects a Buffer found ${typeof body}`);
    }
  };
}
