"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const index_1 = require("../lib/index");
const chaiAsPromised = require("chai-as-promised");
const request = require('supertest-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;
const Connect = require("connect");
const integrationTest_1 = require("./integrationTest");
describe('SenegraphConnect Types Tests', () => {
    it('should be function', () => {
        expect(index_1.senegraphConnect).to.be.a('function');
    });
});
function createApp(options) {
    return new Promise((resolve, reject) => {
        options.senecaOptions = {
            log: 'test',
        };
        const app = Connect();
        app.use('/graphql', index_1.senegraphConnect(options));
        resolve(app);
    });
}
describe('SenegraphConnect Middleware Tests', () => {
    integrationTest_1.default(createApp);
});
//# sourceMappingURL=senegraphConnectTest.js.map