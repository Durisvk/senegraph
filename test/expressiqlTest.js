"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const request = require('supertest-as-promised');
const index_1 = require("../lib/index");
const Express = require("express");
describe('ExpressiQL Types Tests', () => {
    it('expressiql should be a function', () => {
        chai_1.expect(index_1.expressiql).to.be.a('function');
    });
});
function createApp(options) {
    const app = Express();
    app.use('/graphiql', index_1.expressiql(options));
    return app;
}
describe('ExpressiQL Plugin Tests', () => {
    it('expressiql should render a page', () => {
        const app = createApp({
            endpointURL: '/graphql'
        });
        request(app).get('/graphiql').query({}).then((res) => {
            chai_1.expect(res.text).to.contain('<title>GraphiQL</title>');
        });
    });
});
//# sourceMappingURL=expressiqlTest.js.map