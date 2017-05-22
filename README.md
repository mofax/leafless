Leafless
========

Leafless is a tiny async-await ready web library for [NodeJS](https://nodejs.org)  

## Installation
```bash
$ yarn add leafless
```

## Usage: Hello World
```javascript
let LL = require("leafless");
let app = new LL();

// hello world [GET]
app.route("/hello", {
  async get(ctx) {
    ctx.response.text("Hello World");
  }
})

/** a POST request to /hello returns a 405 */

// allow both POST and GET requests
app.route("/hello2", {
  async get(ctx) {
    ctx.response.text("Hello World");
  }

  // ContentType application/json
  async post(ctx) {
    ctx.response.json({ data:"Hello World"});
  }
})

// read http request body
app.route("/data", {
  async post(ctx) {
    // read request body as json
    let body = await ctx.request.json();
    if (!body.code) {
      ctx.response.status(400);
      ctx.response.json({error: "body must have code!"});
      return;
    }
    ctx.response.json({data: "everything is cool"});
  }
})

// serve a file from the filesystem as response
app.route("/data", {
  async post(ctx) {
    ctx.response.sendFile("/absolute/path/to/file");
  }
})

app.listen(8000); // listen and serve
```