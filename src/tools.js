'use strict';

module.exports = tools();

const HTTP_CODES = {
    '404':'Not Found',
    '405': 'Method Not Allowed'
};

function tools() {
    return {
        httpError(status, req, res) {
            res.statusCode = Number(status);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: {
                    message: HTTP_CODES[`${status}`]
                }
            }));
        }
    };
}