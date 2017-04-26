#! env node

"use strict";

let ll = require("../src/leafless");

let app = new ll();

const PORT = 3001;

console.log(`example listening on port ${PORT}`);
app.listen(PORT);

app.static("/", "static", {});
// app.static("/static", "static", {});

// app.route(
//   "/",
//   class HomeHandler {
//     *get(ctx) {
//       let val = yield Promise.resolve({ status: "yes" });
//       return val;
//     }
//   }
// );

app.route("/:tool/:path", {
  *post(ctx) {
    return ctx.params;
  }
});
