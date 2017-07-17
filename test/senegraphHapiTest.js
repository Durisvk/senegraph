"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const index_1 = require("../lib/index");
const chaiAsPromised = require("chai-as-promised");
const request = require('supertest-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;
const hapi = require("hapi");
const Promise = require("bluebird");
const integrationTest_1 = require("./integrationTest");
describe('SenegraphHapi Types Tests', () => {
    it('senegraphHapi should be a function', () => {
        expect(index_1.senegraphHapi).to.be.a('function');
    });
    it('senegraphHapi.attributes should be an object', () => {
        expect(index_1.senegraphHapi.attributes).to.be.an('object');
    });
});
function createApp(options, done) {
    return new Promise((resolve, reject) => {
        const server = new hapi.Server();
        options.senecaOptions = {
            log: 'test',
        };
        server.connection({
            host: 'localhost',
            port: 8000,
        });
        server.register({
            register: index_1.senegraphHapi,
            options,
        }, (err) => {
            if (err) {
                reject(err);
            }
            resolve(server.listener);
        });
    }).nodeify(done);
}
describe('SenegraphHapi Plugin Tests', () => {
    integrationTest_1.default(createApp);
});
//# sourceMappingURL=senegraphHapiTest.js.map