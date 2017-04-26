"use strict";

let fs = require("fs");
let path = require("path");
let mime = require("../vendor/mime");

module.exports = function staticHandler(obj) {
  let { route, urlPath, directory, options } = obj;
  let pathAsterix = urlPath.endsWith("/") ? `${urlPath}*` : `${urlPath}/*`;
  class StaticHandler {
    /**
     * read a file from the file system; checks for mime type too
     */
    getFile(dir, _path) {
      return new Promise((resolve, reject) => {
        let fetch = path.join(dir, _path);

        if (!path.isAbsolute(fetch)) {
          fetch = path.join(process.cwd(), fetch);
        }

        fs.readFile(fetch, (err, content) => {
          if (err) {
            return reject(err);
          }

          let type = mime.lookup(fetch);
          resolve({ type, content });
        });
      });
    }

    *get(ctx) {
      try {
        let pathSplit = ctx.pathname.split(urlPath);

        let findFile = pathSplit[1] === "/" || pathSplit[1] === ""
          ? "/index.html"
          : pathSplit[1];

        let contents = yield this.getFile(directory, findFile);
        return contents;
      } catch (err) {
        if (err.code === "ENOENT") {
          // 404
          ctx.setStatus(404);
          return "file not found";
        } else {
          console.error(err);
          ctx.setStatus(500);
          return "internal server error";
        }
      }
    }
  }

  route(urlPath, StaticHandler);
  route(pathAsterix, StaticHandler);
};
