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
const Express = require("express");
describe('SenegraphExpress Types Tests', () => {
    it('senegraphExpress should be function', () => {
        expect(index_1.senegraphExpress).to.be.a('function');
    });
});
function createApp(options) {
    const app = Express();
    app.use('/graphql', index_1.senegraphExpress(options));
    return app;
}
describe('SenegraphExpress Middleware Tests', () => {
    it('senegraphExpress middleware should not fail when used.', () => {
        expect(function () {
            createApp({
                schema: testSimpleSchema_1.default,
                resolvers: testSimpleResolvers_1.default,
            });
        }).not.to.throw();
    });
    it('senegraphExpress middleware should handle a simple request and process a graphQL query.', () => {
        const app = createApp({
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
        });
        return request(app).post('/graphql').send({
            query: 'query test { hello }'
        }).then((res) => {
            expect(res.body).to.deep.equal({ data: { hello: 'world' } });
        });
    });
    it('senegraphExpress middleware should call the setupSeneca once at the beginning with seneca.', () => {
        const options = {
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
            setupSeneca: (seneca) => {
                expect(seneca).to.exist;
                expect(seneca.add).to.exist;
                expect(seneca.act).to.exist;
            }
        };
        const spy = sinon.spy(options, 'setupSeneca');
        const app = createApp(options);
        return request(app).post('/graphql').send({
            query: 'query test { hello }'
        }).then((res) => {
            return request(app).post('/graphql').send({
                query: 'query test { hello }'
            });
        }).then((res) => {
            assert(spy.calledOnce, 'senegraphExpress middleware should call setupSeneca only once');
        });
    });
    it('senegraphExpress middleware should call the perRequest once at the on each request (twice).', () => {
        const options = {
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
            perRequest: (seneca) => {
            }
        };
        const spy = sinon.spy(options, 'perRequest');
        const app = createApp(options);
        return request(app).post('/graphql').send({
            query: 'query test { hello }'
        }).then((res) => {
            return request(app).post('/graphql').send({
                query: 'query test { hello }'
            });
        }).then((res) => {
            assert(spy.calledTwice, 'senegraphExpress middleware should call perRequest on every request (twice)');
        });
    });
    it('senegraphExpress middleware should return an error if perRequest returns the error', () => {
        const dummyErrorMessage = 'I am a dummy error';
        const options = {
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
            perRequest: (seneca) => {
                return new Error(dummyErrorMessage);
            }
        };
        const app = createApp(options);
        return request(app).post('/graphql').send({
            query: 'query test { hello }'
        }).then((res) => {
            expect(res.body).to.deep.equal({ errors: [{ message: 'Failed on perRequest with message: ' + dummyErrorMessage }] });
            return res;
        });
    });
    it('senegraphExpress middleware should return an error if perRequest promise resolves to the error', () => {
        const dummyErrorMessage = 'I am a dummy error';
        const options = {
            schema: testSimpleSchema_1.default,
            resolvers: testSimpleResolvers_1.default,
            perRequest: (seneca) => {
                return new Promise((resolve, reject) => {
                    reject(new Error(dummyErrorMessage));
                });
            }
        };
        const app = createApp(options);
        return request(app).post('/graphql').send({
            query: 'query test { hello }'
        }).then((res) => {
            expect(res.body).to.deep.equal({ errors: [{ message: 'Failed on perRequest with message: ' + dummyErrorMessage }] });
            return res;
        });
    });
    it('senegraphExpress middleware should add a rootValue, custom context and a seneca into context of resolvers', () => {
        const dummyErrorMessage = 'I am a dummy error';
        const options = {
            schema: testSimpleSchema_1.default,
            resolvers: {
                Query: {
                    hello: (root, args, context) => {
                        expect(context.seneca).to.exist;
                        expect(context.seneca.act).to.exist;
                        expect(context.seneca.act).to.be.a('function');
                        expect(root.some).to.be.equal('data');
                        expect(context.any).to.be.equal('one');
                        return 'world';
                    },
                },
            },
            perRequest: (seneca, request, response) => {
                return {
                    rootValue: { some: 'data' },
                    context: { any: 'one' },
                };
            }
        };
        const app = createApp(options);
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
    it('senegraphExpress middleware call graphql query with argument and variable', () => {
        const options = {
            schema: testSchemaWithVariables_1.default,
            resolvers: {
                Query: {
                    hello: (root, args, context) => {
                        return args.someArgument + '\'s world';
                    },
                },
            },
        };
        const app = createApp(options);
        return request(app).post('/graphql').send({
            query: 'query test($someVariable: String!) { hello(someArgument: $someVariable) }',
            variables: '{ someVariable: "durisvk" }'
        }).then((res) => {
            expect(res.body).to.deep.equal({ data: { hello: 'durisvk\'s world' } });
            return res;
        });
    });
    it('senegraphExpress middleware should pass an integration tests', () => {
        const options = {
            schema: `
        type Query {
          hello(name: String!): String!
        }
        schema {
          query: Query
        }
      `,
            resolvers: {
                Query: {
                    hello: (root, args, context) => {
                        return context.seneca.actWithPromise({ role: 'greeter', cmd: 'sayHello', name: args.name })
                            .then((result) => result.message);
                    },
                },
            },
            setupSeneca: (seneca) => {
                seneca.add({ role: 'greeter', cmd: 'sayHello' }, (message, done) => {
                    if (message.name) {
                        setTimeout(() => {
                            done(null, { message: 'Hello ' + message.name });
                        }, 100);
                    }
                    else {
                        done(new Error('You must provide an user'));
                    }
                });
            }
        };
        const app = createApp(options);
        return request(app).post('/graphql').send({
            query: 'query test($name: String!) { hello(name: $name) }',
            variables: '{ name: "durisvk" }'
        }).then((res) => {
            expect(res.body).to.deep.equal({ data: { hello: 'Hello durisvk' } });
            return res;
        });
    });
});
//# sourceMappingURL=senegraphExpressTest.js.map