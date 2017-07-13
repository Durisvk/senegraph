"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const request = require('supertest-as-promised');
const index_1 = require("../lib/index");
const hapi = require("hapi");
const Promise = require("bluebird");
describe('HapiQL Types Tests', () => {
    it('hapiql should be a function', () => {
        chai_1.expect(index_1.hapiql).to.be.a('function');
    });
    it('hapiql.attributes should be an object', () => {
        chai_1.expect(index_1.hapiql.attributes).to.be.an('object');
    });
});
function createApp(options, done) {
    return new Promise((resolve, reject) => {
        const server = new hapi.Server();
        server.connection({
            host: 'localhost',
            port: 8000,
        });
        server.register({
            register: index_1.hapiql,
            options,
        }, (err) => {
            if (err) {
                reject(err);
            }
            resolve(server.listener);
        });
    }).nodeify(done);
}
describe('HapiQL Plugin Tests', () => {
    it('hapiql should render a page', () => {
        return createApp({
            path: '/graphiql',
            hapiqlOptions: {
                endpointURL: '/graphql',
            },
        })
            .then((app) => {
            return request(app).get('/graphiql').query({})
                .then((res) => {
                chai_1.expect(res.text).to.contain('<title>GraphiQL</title>');
            });
        });
    });
});
//# sourceMappingURL=hapiqlTest.js.map