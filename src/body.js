"use strict";

function wait(req) {
  return new Promise((resolve, reject) => {
    let buf = null;
    if (req.body) return resolve(buf);

    req.on("data", chunk => {
      if (buf === null) {
        buf = chunk;
        return;
      }
      buf = buf + chunk;
    });

    req.on("end", () => {
      req.body = buf;
      resolve(buf);
    });
  });
}

exports.request = function parser(ctx, req) {
  ctx.json = async function json() {
    let data = await wait(req);
    return JSON.parse(data);
  };

  ctx.text = async function text() {
    let data = await wait(req);
    return data.toString();
  };

  ctx.buffer = async function buf() {
    return await wait(req);
  };
};

exports.response = function parser(ctx, res) {
  ctx.json = async function json(body) {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body))
  };

  ctx.text = async function text(body) {
    res.setHeader("Content-Type", "text/plain");
    res.end(body.toString());
  };

  ctx.buffer = async function buf(body) {
    if (Buffer.isBuffer(body)) {
      res.end(body);
    } else {
      throw new Error(`response.buffer expects a Buffer found ${typeof body}`);
    }
  };
};
