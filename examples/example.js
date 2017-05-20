#! env node

"use strict";

let path = require("path");
let ll = require("../src/leafless");

let app = new ll();

const PORT = 3001;

console.log(`example listening on port ${PORT}`);
app.listen(PORT);

// app.route("/:tool/:path", {
//   *get(ctx) {
//     ctx.end(ctx.params);
//   }
// });

app.static("/static", "static", {});
app.route("/*", {
  *get(ctx) {
    ctx.response.sendFile(path.join(__dirname, "static/index.html"));
  }
});

// app.route(
//   "/",
//   class HomeHandler {
//     *get(ctx) {
//       let val = yield Promise.resolve({ status: "yes" });
//       return val;
//     }
//   }
// );
