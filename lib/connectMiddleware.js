"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tools_1 = require("graphql-tools");
const graphql_1 = require("graphql");
const Seneca = require("seneca");
const GraphiQL = require("./graphiql/resolveGraphiQLString");
const _ = require("lodash");
const JSON5 = require("json5");
const bodyParser = require("body-parser");
const common_1 = require("./common");
const url = require("url");
let seneca;
const _internals = {};
const senegraphConnect = function (options) {
    seneca = Seneca(options.senecaOptions);
    common_1.enrichSeneca(seneca);
    if (options.setupSeneca) {
        options.setupSeneca(seneca);
    }
    const def = {
        typeDefs: options.schema,
        resolvers: options.resolvers,
    };
    const execSchema = graphql_tools_1.makeExecutableSchema(def);
    return function (req, res, next) {
        res.setHeader('Content-Type', 'application/json');
        common_1.runPerRequest(options, req, res, seneca)
            .then((userParams) => {
            if (_.isError(userParams)) {
                return res.end(JSON.stringify({ errors: [{ message: 'Failed on perRequest with message: ' + userParams.message }] }));
            }
            bodyParser.json({})(req, res, () => {
                _internals.executeGraphQLQuery(req, res, execSchema, userParams, next);
            });
        });
    };
};
exports.senegraphConnect = senegraphConnect;
const connectiql = function (options) {
    return function (req, res, next) {
        bodyParser.json({})(req, res, () => {
            let query = null;
            if (req.method === 'GET') {
                const q = _internals.getQuery(req);
                query = q.query;
            }
            else {
                query = req.body.query;
            }
            GraphiQL.resolveGraphiQLString(query, options, req).then((graphiqlString) => {
                res.end(graphiqlString);
                next();
            });
        });
    };
};
exports.connectiql = connectiql;
_internals.executeGraphQLQuery = (req, res, execSchema, userParams, next) => {
    let context = { seneca };
    if (!userParams.context) {
        userParams.context = {};
    }
    context = common_1.applyToDefaultsWithoutCopy(context, userParams.context);
    const rootValue = userParams.rootValue;
    let query = null;
    let vars = null;
    if (req.method === 'GET') {
        const q = _internals.getQuery(req);
        query = q.query;
        vars = q.variables;
    }
    else {
        query = req.body.query;
        vars = req.body.variables;
    }
    if (typeof vars === 'string') {
        vars = JSON5.parse(vars);
    }
    graphql_1.graphql(execSchema, query, rootValue, context, vars)
        .then((result) => {
        res.end(JSON.stringify(result));
        next();
    })
        .catch((err) => {
        console.error(err);
        next();
    });
};
_internals.getQuery = function (req) {
    const urlParts = url.parse(req.url, true);
    const query = urlParts.query;
    return query;
};
//# sourceMappingURL=connectMiddleware.js.map