'use strict';

let ll = require('../src/leafless');

let app = new ll();

const PORT = 3001;

console.log(`example listening on port ${PORT}`);
app.listen(PORT);

app.route('/', class HomeHandler {
    *get(ctx) {
        let val = yield Promise.resolve({ status: 'yes' });
        return val;
    }
});

app.route('/:tool/:path', class ToolHandler {
    *get(ctx) {
        console.log(ctx);
        return ctx.params;
    }
});