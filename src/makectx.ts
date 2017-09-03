"use strict";

import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from "http";
import * as parseUrl from "parseurl";
import * as querystring from "querystring";
import * as fs from "fs";
import * as send from "send";
import * as body from "./body";

import { streamFile } from "./util";

export type CTX = {
  _req: IncomingMessage;
  _res: ServerResponse;
  host: string | string[];
  url: string;
  parsedUrl: any;
  params: any;
  query: any;

  request?: {
    headers: () => IncomingHttpHeaders;
    text: () => void;
    json: () => void;
    buffer: () => void;
  };
  response?: {
    setHeader: (key: string, value: string) => void;
    status: (num: number) => void;
    sendFile: (path: string) => void;
    text: () => void;
    json: () => void;
    buffer: () => void;
  };
};

export function makectx(
  request: IncomingMessage,
  response: ServerResponse,
  routed: any,
  URL: any
) {
  let ctx: CTX = {
    _req: request,
    _res: response,
    host: request.headers.host,
    url: request.url,
    parsedUrl: URL,
    params: routed.params,
    query: querystring.parse(URL.query)
  };

  ctx = Object.assign(ctx, { request: {}, response: {} });

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
}
