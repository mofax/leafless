"use strict";

let path = require("path");
let LL = require("..");

let app = new LL();

app.route("/hello", {
  async get(ctx) {
    ctx.response.json({ hello: "world" });
  }
});

app.route("/file", {
  async get(ctx) {
    ctx.response.sendFile(path.join(__dirname, "hello.js"));
  }
});

let port = 8000;
console.log(`starting on port`, port);
app.listen(8000);
