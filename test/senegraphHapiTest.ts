import * as chai from 'chai';
import { senegraphHapi, ISenegraphHapiOptions } from '../lib/index';

import testSimpleSchema from './testSimpleSchema';
import testSimpleResolvers from './testSimpleResolvers';
import testSchemaWithVariables from './testSchemaWithVariables';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

const request = require('supertest-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;

import * as hapi from 'hapi';

import * as Promise from 'bluebird';

import testSuite from './integrationTest';

describe('SenegraphHapi Types Tests', () => {
  it('senegraphHapi should be a function', () => {
    expect(senegraphHapi).to.be.a('function');
  });
  it('senegraphHapi.attributes should be an object', () => {
    expect(senegraphHapi.attributes).to.be.an('object');
  })

});


function createApp(options: ISenegraphHapiOptions, done?: Function): Promise<hapi.ServerListener> {
  return new Promise<hapi.ServerListener>((resolve, reject) => {
    const server = new hapi.Server();

    options.senecaOptions = {
      log: 'test',
    }

    server.connection({
      host: 'localhost',
      port: 8000,
    });

    server.register({
      register: senegraphHapi,
      options,
    }, (err: Error) => {
      if (err) {
        reject(err);
      }
      resolve(server.listener);
    });
  }).nodeify(done);
}

describe('SenegraphHapi Plugin Tests', () => {
  testSuite(createApp);
});
