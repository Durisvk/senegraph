import * as chai from 'chai';
import { senegraphExpress, ISenegraphExpressOptions } from '../lib/index';

import testSimpleSchema from './testSimpleSchema';
import testSimpleResolvers from './testSimpleResolvers';
import testSchemaWithVariables from './testSchemaWithVariables';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

const request = require('supertest-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;

import * as Express from 'express';

import testSuite from './integrationTest';

describe('SenegraphExpress Types Tests', () => {

  it('senegraphExpress should be function', () => {
    expect(senegraphExpress).to.be.a('function');
  });

});

function createApp(options: any) {
  return new Promise((resolve: any, reject: any) => {
    options.senecaOptions = {
      log: 'test',
    }

    const app = Express();
    app.use('/graphql', senegraphExpress(options));
    resolve(app);
  });
}

describe('SenegraphExpress Middleware Tests', () => {
  testSuite(createApp);
});
