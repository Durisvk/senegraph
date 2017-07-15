import { expect } from 'chai';

const request = require('supertest-as-promised');

import { expressiql, ExpressiQLOptions } from '../lib/index';

import * as Express from 'express';

describe('ExpressiQL Types Tests', () => {
  it('expressiql should be a function', () => {
    expect(expressiql).to.be.a('function');
  });
});

function createApp(options: ExpressiQLOptions) {
  const app = Express();
  app.use('/graphiql', expressiql(options));
  return app;
}


describe('ExpressiQL Plugin Tests', () => {
  it('expressiql should render a page', () => {
    const app = createApp({
      endpointURL: '/graphql'
    });
    request(app).get('/graphiql').query({}).then((res: any) => {
      expect(res.text).to.contain('<title>GraphiQL</title>')
    })
  });
});
