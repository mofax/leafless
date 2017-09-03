"use strict";

import { IncomingMessage, ServerResponse } from "http";
import * as path from "path";
import * as fs from "fs";
import * as mime from "mime";

/**
 * a Promised readfile
 */
export function readFile(filename: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err: Error, data: Buffer) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

/**
 * stream a file to a http response object
 */
export function streamFile(filename: string, res: ServerResponse) {
  if (!path.isAbsolute(filename)) {
    throw new Error(`stream file expects an absolute path found ${filename}`);
  }
  let mimeType = mime.lookup(filename);
  // res.writeHead(200, { "Content-Type": mimeType});
  let readstream = fs.createReadStream(filename);
  readstream.on("error", err => {
    if ((err.code = "ENOENT")) {
      // file not found
      res.statusCode = 404;
      res.end("Not Found");
    } else {
      console.error(err);
      res.statusCode = 500;
      res.end("Unknown Server Error");
    }
  });

  res.statusCode = 200;
  res.setHeader("Content-Type", mimeType);
  readstream.pipe(res);
}
