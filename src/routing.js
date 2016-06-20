'use strict';

let HttpHash = require('http-hash');

// initialize http hash
let hash = HttpHash();


let routing = {

    hash: hash,

    /**
     * route - takes a path, and a constructor and registers it as a hander
     * 
     * @param {string} path - the url path to listen for
     * @param {function} - the handler function
     */
    route(path, handler) {
        if (typeof (path) !== 'string') {
            throw new Error('path needs to be a string');
        }

        if (typeof (handler) !== 'function') {
            throw new Error('handler must be a constructor function');
        }

        hash.set(path, handler);
    }

};

module.exports = routing;