import { expect } from 'chai';

const request = require('supertest-as-promised');

import { hapiql, IHapiQLOptions } from '../lib/index';

import * as hapi from 'hapi';

import * as Promise from 'bluebird';

describe('HapiQL Types Tests', () => {
  it('hapiql should be a function', () => {
    expect(hapiql).to.be.a('function');
  });
  it('hapiql.attributes should be an object', () => {
    expect(hapiql.attributes).to.be.an('object');
  });
});

function createApp(options: IHapiQLOptions, done?: Function): Promise<hapi.ServerListener> {
  return new Promise<hapi.ServerListener>((resolve, reject) => {
    const server = new hapi.Server();

    server.connection({
      host: 'localhost',
      port: 8000,
    });

    server.register({
      register: hapiql,
      options,
    }, (err: Error) => {
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
          .then((res: any) => {
            expect(res.text).to.contain('<title>GraphiQL</title>')
          })
      });
  });
});
