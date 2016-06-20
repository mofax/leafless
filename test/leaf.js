'use strict';

let assert = require('chai').assert;
let expect = require('chai').expect;

let LL = require('../src/leafless');

describe('leafapp', function () {
    describe('The LeafLess Class', function () {
        it('bootstraps the leafless app', function () {
            expect((typeof(LL) === 'function')).to.be.true;
            expect(() => {
                let app = LL();
            }).to.throw(`Class constructor LeafLess cannot be invoked without 'new'`);
        });
    });
    
    describe('LeafLess API', function () {
        let app = new LL();
        it('exposes a listen function', () => {
            expect(typeof(app.listen) === 'function').to.be.true;
        });
        it('exposes a route function', () => {
            expect(typeof(app.route) === 'function').to.be.true;
        });
    });
});