'use strict';

let pRegex = require('./pathtoregexp');
let objectList = [];
let homeHandler;

function routeObject(exp, keys, handler) {
  return {
    match(str) {
      let test = exp.exec(str);
      if (!test) {
        return null;
      }

      let params = {};
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
  set(path, handler) {
    if (typeof (path) !== 'string') {
      throw new TypeError('expecting path to be a string');
    }

    if (path === '/' || path === '') {
      // home
      homeHandler = handler;
      return;
    }

    let keys = [];
    let re = pRegex(path, keys);
    // append to object list
    objectList[objectList.length] = routeObject(re, keys, handler);
  },

  get(path) {
    if (typeof (path) !== 'string') {
      throw new TypeError('expecting path to be a string');
    }

    if (path === '/' || path === '') {
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
      if (match) {
        return match;
      }
    }

    // default return null handler
    return { handler: null };
  }
};

module.exports = routing;