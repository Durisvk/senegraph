import { expect } from 'chai';

const request = require('supertest-as-promised');

import { connectiql, ConnectiQLOptions } from '../lib/index';

import * as Connect from 'connect';

describe('ConnectiQL Types Tests', () => {
  it('should be a function', () => {
    expect(connectiql).to.be.a('function');
  });
});

function createApp(options: ConnectiQLOptions) {
  const app = Connect();
  app.use('/graphiql', connectiql(options));
  return app;
}


describe('ConnectiQL Plugin Tests', () => {
  it('should render a page', () => {
    const app = createApp({
      endpointURL: '/graphql'
    });
    request(app).get('/graphiql').query({}).then((res: any) => {
      expect(res.text).to.contain('<title>GraphiQL</title>')
    })
  });
});
