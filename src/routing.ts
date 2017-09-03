"use strict";

import * as pRegex from "path-to-regexp";
import { CTX } from "./makectx";

export type HandlerHTTPMethod = (ctx: CTX) => Promise<any>;

export type MatchObject = {
  params: any;
  handler: Handler;
};

export type RouteObject = {
  match: (str: string) => MatchObject;
};

export type Handler = {
  [key: string]: any;
  get?: HandlerHTTPMethod;
  post?: HandlerHTTPMethod;
  put?: HandlerHTTPMethod;
  delete?: HandlerHTTPMethod;
  options?: HandlerHTTPMethod;
};

let objectList: RouteObject[] = [];
let homeHandler: Handler;

function routeObject(
  exp: pRegex.PathRegExp,
  keys: pRegex.Key[],
  handler: Handler
) {
  return {
    match(str: string) {
      let test = exp.exec(str);
      if (!test) {
        return null;
      }

      let params: { [key: string]: any } = {};
      for (let i = 0; i < keys.length; i++) {
        params[keys[i].name] = test[i + 1];
      }

      return {
        params,
        handler
      };
    }
  };
}

let routing = {
  set(path: string, handler: Handler) {
    if (typeof path !== "string") {
      throw new TypeError("expecting path to be a string");
    }

    if (path === "/" || path === "") {
      // home
      homeHandler = handler;
      return;
    }

    let keys: any[] = [];
    let re = pRegex(path, keys);
    // append to object list
    objectList[objectList.length] = routeObject(re, keys, handler);
  },

  get(path: string) {
    if (typeof path !== "string") {
      throw new TypeError("expecting path to be a string");
    }

    if (path === "/" || path === "") {
      if (homeHandler) {
        return {
          handler: homeHandler
        };
      }
      return { handler: null };
    }

    for (let i = 0; i < objectList.length; i++) {
      let obj = objectList[i];
      let match = obj.match(path);
      if (match != undefined) {
        return match;
      }
    }

    // default return null handler
    return { handler: null };
  }
};

export { routing };
