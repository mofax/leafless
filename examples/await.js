#! env node

'use strict';

let ll = require('../src/leafless');

let app = new ll();

const PORT = 3001;

console.log(`example listening on port ${PORT}`);
app.listen(PORT);

app.static('/static', 'dir', {});

app.route('/', class HomeHandler {
  async get(ctx) {
    let val = await Promise.resolve({ hello: 'world!' });
    return val;
  }
});

app.route('/:tool/:path', class ToolHandler {
  async post(ctx) {
    return ctx.params;
  }
});
