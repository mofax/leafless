'use strict';

let ll = require('../src/leafless');

let app = new ll();


app.listen(3000);

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