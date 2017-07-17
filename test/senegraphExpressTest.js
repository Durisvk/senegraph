"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const index_1 = require("../lib/index");
const chaiAsPromised = require("chai-as-promised");
const request = require('supertest-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;
const Express = require("express");
const integrationTest_1 = require("./integrationTest");
describe('SenegraphExpress Types Tests', () => {
    it('senegraphExpress should be function', () => {
        expect(index_1.senegraphExpress).to.be.a('function');
    });
});
function createApp(options) {
    return new Promise((resolve, reject) => {
        options.senecaOptions = {
            log: 'test',
        };
        const app = Express();
        app.use('/graphql', index_1.senegraphExpress(options));
        resolve(app);
    });
}
describe('SenegraphExpress Middleware Tests', () => {
    integrationTest_1.default(createApp);
});
//# sourceMappingURL=senegraphExpressTest.js.map