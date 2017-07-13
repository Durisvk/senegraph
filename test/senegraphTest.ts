import * as chai from 'chai';
import { senegraph, ISenegraphOptions } from '../lib/index';

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

describe('Senegraph Types Tests', () => {
  it('senegraph should be a function', () => {
    expect(senegraph).to.be.a('function');
  });
  it('sengraph.attributes should be an object', () => {
    expect(senegraph.attributes).to.be.an('object');
  })

});


function createApp(options: ISenegraphOptions, done?: Function): Promise<hapi.ServerListener> {
  return new Promise<hapi.ServerListener>((resolve, reject) => {
    const server = new hapi.Server();

    server.connection({
      host: 'localhost',
      port: 8000,
    });

    server.register({
      register: senegraph,
      options,
    }, (err: Error) => {
      if (err) {
        reject(err);
      }
      resolve(server.listener);
    });
  }).nodeify(done);
}

describe('Senegraph Plugin Tests', () => {
  it('senegraph plugin should not fail when registering', () => {
    return expect(createApp({
      schema: testSimpleSchema,
      resolvers: {
        Query: {
          hello: (root: any, args: any, context: any) => {
            return 'world';
          }
        }
      }
    })).to.be.fulfilled;
  });
  it('senegraph plugin should add route handler and call simple graphql query', () => {
    return createApp({
      schema: testSimpleSchema,
      resolvers: testSimpleResolvers,
    }).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }'
      }).then((res: any) => {
        expect(res.status).to.equal(200);
        expect(res.body.data).to.deep.equal({ hello: 'world' });
        return res;
      });
    });
  });

  it('senegraph plugin should add a rootValue', () => {
    return createApp({
      schema: testSimpleSchema,
      resolvers: {
        Query: {
          hello: (root: any, args: any, context: any) => {
            expect(root).to.be.deep.equal({ something: 'good' });
            return 'world';
          }
        }
      },
      perRequest: (seneca: any) => {
        return {
          rootValue: { something: 'good' }
        }
      }
    }).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }'
      }).then((res: any) => {
        expect(res.body.errors).not.to.exist;
        if (res.body.errors) {
          expect(res.body.errors).to.have.lengthOf(0);
        }
        return res;
      });
    });
  });

  it('senegraph plugin should call perRequest on every request (twice)', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: testSimpleResolvers,
      perRequest: (seneca: any) => {
        return { context: { some: 'data' }, rootValue: { another: 'value' } };
      }
    };
    let spy = sinon.spy(options, 'perRequest');

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }'
      }).then((res: any) => {
        return request(app).post('/graphql').send({
          query: 'query test { hello }'
        });
      }).then((res: any) => {
        assert(spy.calledTwice, 'the perRequest should be called twice for every request');
        return res;
      });
    });
  });

  it('senegraph plugin should call perRequest with promise on every request (once)', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: testSimpleResolvers,
      perRequest: (seneca: any) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({ context: { some: 'data' }, rootValue: { another: 'value' } });
          }, 200);
        })
      }
    };
    let spy = sinon.spy(options, 'perRequest');

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }'
      }).then((res: any) => {
        assert(spy.calledOnce, 'the perRequest should be called once for single request');
        return res;
      });
    });
  });

  it('senegraph plugin should call resolver when queried (once)', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: testSimpleResolvers,
    };
    let spy = sinon.spy(options.resolvers.Query, 'hello');

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }'
      }).then((res: any) => {
        assert(spy.calledOnce, 'the perRequest should be called once for single request');
        return res;
      });
    });
  });

  it('senegraph plugin should call perRequest with seneca and request arguments', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: testSimpleResolvers,
      perRequest: (seneca: any, request: any) => {
        expect(seneca).to.exist;
        expect(request).to.exist;
      }
    };

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }'
      }).then((res: any) => {
        expect(res.body.errors).not.to.exist;
        return res;
      });
    });
  });

  it('senegraph plugin should call perRequest and return error if it occurs', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: testSimpleResolvers,
      perRequest: (seneca: any, request: any) => {
        return new Error('This is the test error');
      }
    };

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }'
      }).then((res: any) => {
        expect(res.body.errors).to.exist;
        expect(res.body.errors).have.lengthOf(1);
        return res;
      });
    });
  });

  it('senegraph plugin should call perRequest and return error if it occurs in Promise', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: testSimpleResolvers,
      perRequest: (seneca: any, request: any) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('This is the test error'));
          }, 200);
        });
      }
    };

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }'
      }).then((res: any) => {
        expect(res.body.errors).to.exist;
        expect(res.body.errors).have.lengthOf(1);
        return res;
      });
    });
  });

  it('senegraph plugin should provide the seneca in resolvers context', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: {
        Query: {
          hello: (root: any, args: any, context: any) => {
            expect(context).to.exist;
            expect(context.seneca).to.exist;
            return 'world';
          }
        }
      },
    };

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).get('/graphql').query({
        query: 'query test { hello }'
      }).then((res: any) => {
        expect(res.body.errors).not.to.exist;
        if (res.body.errors) {
          expect(res.body.errors).to.have.lengthOf(0);
        }
        return res;
      });
    });
  });


  it('senegraph plugin should pass a variable into resolver', () => {
    let options = {
      schema: testSchemaWithVariables,
      resolvers: {
        Query: {
          hello: (root: any, args: any, context: any) => {
            expect(args).to.exist;
            expect(args.someArgument).to.exist;
            return args.someArgument;
          }
        }
      },
    };

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).get('/graphql').set('Content-Type', 'application/json').query({
        query: 'query test($someVariable: String!) { hello(someArgument: $someVariable) }',
        variables: '{ someVariable: "durisvk" }',
      })
        .then((res: any) => {
          if (res.body.errors) {
            expect(res.body.errors).to.have.lengthOf(0);
          }
          expect(res.body.data).to.deep.equal({ hello: 'durisvk' });
          return res;
        });
    });
  });


  it('senegraph plugin should setup seneca with promise', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: testSimpleResolvers,
      setupSeneca: () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ some: 'data' });
          }, 100);
        });
      }
    };

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }',
      }).then((res: any) => {

      });
    });
  });

  it('senegraph plugin should add a custom context and rootValue', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: {
        Query: {
          hello: (root: any, args: any, context: any) => {
            expect(root.other).to.be.equal('some');
            expect(context.some).to.be.equal('data');
            return 'world';
          }
        }
      },
      perRequest: (seneca: any) => {
        return {
          context: { some: 'data' },
          rootValue: { other: 'some' },
        }
      }
    };

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }',
      }).then((res: any) => {
        if (res.body.errors) {
          expect(res.body.errors).to.have.lengthOf(0);
        }
      });
    });
  });

  it('senegraph plugin should add a custom context and rootValue with promise', () => {
    let options = {
      schema: testSimpleSchema,
      resolvers: {
        Query: {
          hello: (root: any, args: any, context: any) => {
            expect(root.other).to.be.equal('some');
            expect(context.some).to.be.equal('data');
            return 'world';
          }
        }
      },
      perRequest: (seneca: any) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              context: { some: 'data' },
              rootValue: { other: 'some' },
            });
          }, 200)
        })
      }
    };

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test { hello }',
      }).then((res: any) => {
        if (res.body.errors) {
          expect(res.body.errors).to.have.lengthOf(0);
        }
      });
    });
  });

  it('senegraph plugin should pass the integration tests', () => {
    let options = {
      schema: `
        type Query {
          hello(name: String!): String
        }
      `,
      resolvers: {
        Query: {
          hello: (root: any, args: any, context: any) => {
            return new Promise((resolve: any, reject: any) => {
              context.seneca.act({
                role: 'greeter',
                cmd: 'sayHello',
                user: args.name,
              }, (err: any, greetings: any) => {
                if (err) {
                  return reject(err);
                }
                resolve(greetings.message);
              });
            });
          }
        }
      },
      setupSeneca: (seneca: any) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            seneca.add({ role: 'greeter', cmd: 'sayHello' }, (message: any, done: Function) => {
              if (message.user) {
                done(null, { message: 'Hello ' + message.user });
              } else {
                done(new Error('You forgot to tell me who you are.'))
              }
            });
            resolve();
          }, 100);
        });
      }
    };

    return createApp(options).then((app: hapi.ServerListener) => {
      return request(app).post('/graphql').send({
        query: 'query test($variable: String!) { hello(name: $variable) }',
        variables: { variable: 'durisvk' },
      }).then((res: any) => {
        expect(res.body.data).to.deep.equal({ hello: 'Hello durisvk' });
        return request(app).get('/graphql').query({
          query: 'query test($variable: String!) { hello(name: $variable) }',
          variables: '{ variable: "durisvk" }',
        });
      }).then((res: any) => {
        expect(res.body.data).to.deep.equal({ hello: 'Hello durisvk' });
        return res;
      });
    });
  });

});
