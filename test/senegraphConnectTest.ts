import * as chai from 'chai';
import { senegraphConnect } from '../lib/index';

import testSimpleSchema from './testSimpleSchema';
import testSimpleResolvers from './testSimpleResolvers';
import testSchemaWithVariables from './testSchemaWithVariables';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

const request = require('supertest-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;

import * as Connect from 'connect';

import testSuite from './integrationTest';

describe('SenegraphConnect Types Tests', () => {

  it('should be function', () => {
    expect(senegraphConnect).to.be.a('function');
  });

});

function createApp(options: any) {
  return new Promise((resolve: any, reject: any) => {
    options.senecaOptions = {
      log: 'test',
    }

    const app = Connect();
    app.use('/graphql', senegraphConnect(options));
    resolve(app);
  });
}

describe('SenegraphConnect Middleware Tests', () => {
  testSuite(createApp);
});
