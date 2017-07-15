"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tools_1 = require("graphql-tools");
const graphql_1 = require("graphql");
const Seneca = require("seneca");
const GraphiQL = require("./graphiql/resolveGraphiQLString");
const _ = require("lodash");
const JSON5 = require("json5");
const seneca = Seneca();
const common_1 = require("./common");
common_1.enrichSeneca(seneca);
const Hoek = require("hoek");
const _internals = {};
const senegraphHapi = function (server, options, next) {
    if (!options) {
        throw new Error('senegraph requires options. At least provide schema and resolvers.');
    }
    if (arguments.length !== 3) {
        throw new Error(`Senegraph expects exactly 3 arguments, got ${arguments.length}`);
    }
    let setupSenecaResult = null;
    if (options.setupSeneca) {
        setupSenecaResult = options.setupSeneca.call(seneca, seneca);
    }
    _internals.setupGraphQLRoute(server, options);
    if (setupSenecaResult && _internals.isPromise(setupSenecaResult)) {
        setupSenecaResult.then(() => next());
    }
    else {
        next();
    }
};
exports.senegraphHapi = senegraphHapi;
senegraphHapi.attributes = {
    name: 'senegraph',
    version: '0.0.6',
    pkg: require('../package.json'),
};
const hapiql = function (server, options, next) {
    if (!options || !options.hapiqlOptions) {
        throw new Error('hapiql(GraphiQL) requires options. At least provide endpointURL');
    }
    if (arguments.length !== 3) {
        throw new Error(`HapiQL expects exactly 3 arguments, got ${arguments.length}`);
    }
    _internals.setupGraphiQLRoute(server, options);
    next();
};
exports.hapiql = hapiql;
hapiql.attributes = {
    name: 'hapiql',
    version: '0.0.6',
    pkg: require('../package.json'),
};
_internals.isPromise = function (subj) {
    if (!subj) {
        return false;
    }
    if (subj['then']) {
        return true;
    }
    return false;
};
_internals.setupGraphQLRoute = function (server, options) {
    const def = {
        typeDefs: options.schema,
        resolvers: options.resolvers,
    };
    const execSchema = graphql_tools_1.makeExecutableSchema(def);
    server.route({
        path: options.path || '/graphql',
        method: options.methods || ['POST', 'GET'],
        handler: (request, reply) => {
            common_1.runPerRequest(options, request, reply, seneca)
                .then((userParams) => {
                if (_.isError(userParams)) {
                    return reply({ errors: [{ message: 'Failed on perRequest with message: ' + userParams.message }] });
                }
                _internals.executeGraphQLQuery(request, reply, execSchema, userParams);
            })
                .catch((err) => { throw err; });
        },
    });
};
_internals.setupGraphiQLRoute = function (server, options) {
    server.route({
        path: options.path || '/graphiql',
        method: 'GET',
        handler: (request, reply) => {
            const query = request.query;
            GraphiQL.resolveGraphiQLString(query, options.hapiqlOptions, request).then(graphiqlString => {
                reply(graphiqlString).header('Content-Type', 'text/html');
            }, error => reply(error));
        },
    });
};
_internals.getQueryFromRequest = function (request) {
    if (request.payload && Object.keys(request.payload).length > 0 && request.payload.query) {
        return request.payload.query;
    }
    else if (request.query && Object.keys(request.query).length > 0 && request.query.query) {
        return request.query.query;
    }
    else {
        return {};
    }
};
_internals.getVariablesFromRequest = function (request) {
    if (request.payload && Object.keys(request.payload).length > 0 && request.payload.variables) {
        return request.payload.variables;
    }
    else if (request.query && Object.keys(request.query).length > 0 && request.query.variables) {
        return request.query.variables;
    }
    else {
        return {};
    }
};
_internals.executeGraphQLQuery = function (request, reply, execSchema, userParams) {
    let context = { seneca };
    if (!userParams.context) {
        userParams.context = {};
    }
    context = Hoek.applyToDefaults(context, userParams.context);
    const rootValue = userParams.rootValue;
    const query = _internals.getQueryFromRequest(request);
    let vars = _internals.getVariablesFromRequest(request);
    if (typeof vars === 'string') {
        vars = JSON5.parse(vars);
    }
    graphql_1.graphql(execSchema, query, rootValue, context, vars)
        .then((result) => {
        reply(result);
    })
        .catch(console.error);
};
//# sourceMappingURL=hapiPlugin.js.map