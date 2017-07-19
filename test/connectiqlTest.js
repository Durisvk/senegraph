"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const request = require('supertest-as-promised');
const index_1 = require("../lib/index");
const Connect = require("connect");
describe('ConnectiQL Types Tests', () => {
    it('should be a function', () => {
        chai_1.expect(index_1.connectiql).to.be.a('function');
    });
});
function createApp(options) {
    const app = Connect();
    app.use('/graphiql', index_1.connectiql(options));
    return app;
}
describe('ConnectiQL Plugin Tests', () => {
    it('should render a page', () => {
        const app = createApp({
            endpointURL: '/graphql'
        });
        request(app).get('/graphiql').query({}).then((res) => {
            chai_1.expect(res.text).to.contain('<title>GraphiQL</title>');
        });
    });
});
//# sourceMappingURL=connectiqlTest.js.map