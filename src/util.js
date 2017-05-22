"use strict";

const path = require("path");
const fs = require("fs");
const mime = require("mime");

/**
 * a Promised readfile
 */
exports.readFile = function readFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
};

/**
 * stream a file to a http response object
 */
exports.streamFile = function streamFile(filename, res) {
  if (!path.isAbsolute(filename)) {
    throw new Error(`stream file expects an absolute path found ${filename}`);
  }
  let mimeType = mime.lookup(filename)
  // res.writeHead(200, { "Content-Type": mimeType});
  let readstream = fs.createReadStream(filename)
  readstream.on('error', err => {
    if (err.code = "ENOENT") {
      // file not found
      res.statusCode = 404
      res.end('Not Found');
    } else {
      console.error(err);
      res.statusCode = 500;
      res.end('Unknown Server Error');
    }
  })
  
  res.statusCode = 200;
  res.setHeader('Content-Type', mimeType);
  readstream.pipe(res);
};
