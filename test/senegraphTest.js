"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const index_1 = require("../lib/index");
const testSimpleSchema_1 = require("./testSimpleSchema");
const testSimpleResolvers_1 = require("./testSimpleResolvers");
const testSchemaWithVariables_1 = require("./testSchemaWithVariables");
const chaiAsPromised = require("chai-as-promised");
const sinon = require("sinon");
const request = require('supertest-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;
const hapi = require("hapi");
const Promise = require("bluebird");
describe('Senegraph Types Tests', () => {
    it('senegraph should be a function', () => {
        expect(index_1.senegraph).to.be.a('function');
    });
    it('sengraph.attributes should be an object', () => {
        expect(index_1.senegraph.attributes).to.be.an('object');
    });
});
function createApp(options, done) {
    return new Promise((resolve, reject) => {
        const server = new hapi.Server();
        server.connection({
            host: 'localhost',
            port: 8000,
        });
        server.register({
            register: index_1.senegraph,
            options,
        }, (err) => {
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
            schema: testSimpleSchema_1.default,
            resolvers: {
                Query: {
                    hello: (root, args, context) => {
                        return 'world';
                    }
                }
            }
        })).to.be.fulfilled;
    });
    it('senegraph plugin should add route handler and call simple graphql query', () => {
        return createApp({
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
        }).then((app) => {
            return request(app).post('/graphql').send({
                query: 'query test { hello }'
            }).then((res) => {
                expect(res.status).to.equal(200);
                expect(res.body.data).to.deep.equal({ hello: 'world' });
                return res;
            });
        });
    });
    it('senegraph plugin should add a rootValue', () => {
        return createApp({
            schema: testSimpleSchema_1.default,
            resolvers: {
                Query: {
                    hello: (root, args, context) => {
                        expect(root).to.be.deep.equal({ something: 'good' });
                        return 'world';
                    }
                }
            },
            perRequest: (seneca) => {
                return {
                    rootValue: { something: 'good' }
                };
            }
        }).then((app) => {
            return request(app).post('/graphql').send({
                query: 'query test { hello }'
            }).then((res) => {
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
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
            perRequest: (seneca) => {
                return { context: { some: 'data' }, rootValue: { another: 'value' } };
            }
        };
        let spy = sinon.spy(options, 'perRequest');
        return createApp(options).then((app) => {
            return request(app).post('/graphql').send({
                query: 'query test { hello }'
            }).then((res) => {
                return request(app).post('/graphql').send({
                    query: 'query test { hello }'
                });
            }).then((res) => {
                assert(spy.calledTwice, 'the perRequest should be called twice for every request');
                return res;
            });
        });
    });
    it('senegraph plugin should call perRequest with promise on every request (once)', () => {
        let options = {
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
            perRequest: (seneca) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve({ context: { some: 'data' }, rootValue: { another: 'value' } });
                    }, 200);
                });
            }
        };
        let spy = sinon.spy(options, 'perRequest');
        return createApp(options).then((app) => {
            return request(app).post('/graphql').send({
                query: 'query test { hello }'
            }).then((res) => {
                assert(spy.calledOnce, 'the perRequest should be called once for single request');
                return res;
            });
        });
    });
    it('senegraph plugin should call resolver when queried (once)', () => {
        let options = {
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
        };
        let spy = sinon.spy(options.resolvers.Query, 'hello');
        return createApp(options).then((app) => {
            return request(app).post('/graphql').send({
                query: 'query test { hello }'
            }).then((res) => {
                assert(spy.calledOnce, 'the perRequest should be called once for single request');
                return res;
            });
        });
    });
    it('senegraph plugin should provide the seneca in resolvers context', () => {
        let options = {
            schema: testSimpleSchema_1.default,
            resolvers: {
                Query: {
                    hello: (root, args, context) => {
                        expect(context).to.exist;
                        expect(context.seneca).to.exist;
                        return 'world';
                    }
                }
            },
        };
        return createApp(options).then((app) => {
            return request(app).get('/graphql').query({
                query: 'query test { hello }'
            }).then((res) => {
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
            schema: testSchemaWithVariables_1.default,
            resolvers: {
                Query: {
                    hello: (root, args, context) => {
                        expect(args).to.exist;
                        expect(args.someArgument).to.exist;
                        return args.someArgument;
                    }
                }
            },
        };
        return createApp(options).then((app) => {
            return request(app).get('/graphql').set('Content-Type', 'application/json').query({
                query: 'query test($someVariable: String!) { hello(someArgument: $someVariable) }',
                variables: '{ someVariable: "durisvk" }',
            })
                .then((res) => {
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
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
            setupSeneca: () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({ some: 'data' });
                    }, 100);
                });
            }
        };
        return createApp(options).then((app) => {
            return request(app).post('/graphql').send({
                query: 'query test { hello }',
            }).then((res) => {
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
                    hello: (root, args, context) => {
                        return new Promise((resolve, reject) => {
                            context.seneca.act({
                                role: 'greeter',
                                cmd: 'sayHello',
                                user: args.name,
                            }, (err, greetings) => {
                                if (err) {
                                    return reject(err);
                                }
                                resolve(greetings.message);
                            });
                        });
                    }
                }
            },
            setupSeneca: (seneca) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        seneca.add({ role: 'greeter', cmd: 'sayHello' }, (message, done) => {
                            if (message.user) {
                                done(null, { message: 'Hello ' + message.user });
                            }
                            else {
                                done(new Error('You forgot to tell me who you are.'));
                            }
                        });
                        resolve();
                    }, 100);
                });
            }
        };
        return createApp(options).then((app) => {
            return request(app).post('/graphql').send({
                query: 'query test($variable: String!) { hello(name: $variable) }',
                variables: { variable: 'durisvk' },
            }).then((res) => {
                expect(res.body.data).to.deep.equal({ hello: 'Hello durisvk' });
                return request(app).get('/graphql').query({
                    query: 'query test($variable: String!) { hello(name: $variable) }',
                    variables: '{ variable: "durisvk" }',
                });
            }).then((res) => {
                expect(res.body.data).to.deep.equal({ hello: 'Hello durisvk' });
                return res;
            });
        });
    });
});
//# sourceMappingURL=senegraphTest.js.map