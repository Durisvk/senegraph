"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tools_1 = require("graphql-tools");
const graphql_1 = require("graphql");
const Seneca = require("seneca");
const GraphiQL = require("./graphiql/resolveGraphiQLString");
const _ = require("lodash");
const Hoek = require("hoek");
const JSON5 = require("json5");
const bodyParser = require("body-parser");
const seneca = Seneca();
const common_1 = require("./common");
common_1.enrichSeneca(seneca);
const _internals = {};
const senegraphExpress = function (options) {
    if (options.setupSeneca) {
        options.setupSeneca(seneca);
    }
    const def = {
        typeDefs: options.schema,
        resolvers: options.resolvers,
    };
    const execSchema = graphql_tools_1.makeExecutableSchema(def);
    return function (req, res, next) {
        common_1.runPerRequest(options, req, res, seneca)
            .then((userParams) => {
            if (_.isError(userParams)) {
                return res.send({ errors: [{ message: 'Failed on perRequest with message: ' + userParams.message }] });
            }
            bodyParser.json({})(req, res, () => {
                _internals.executeGraphQLQuery(req, res, execSchema, userParams, next);
            });
        });
    };
};
exports.senegraphExpress = senegraphExpress;
const expressiql = function (options) {
    return function (req, res, next) {
        bodyParser.json({})(req, res, () => {
            const query = req.body;
            GraphiQL.resolveGraphiQLString(query, options, req).then((graphiqlString) => {
                res.send(graphiqlString);
                next();
            });
        });
    };
};
exports.expressiql = expressiql;
_internals.getQueryFromRequest = (request) => {
    return request.body.query;
};
_internals.getVariablesFromRequest = (request) => {
    return request.body.variables;
};
_internals.executeGraphQLQuery = (request, response, execSchema, userParams, next) => {
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
        response.send(result);
        next();
    })
        .catch((err) => {
        console.error(err);
        next();
    });
};
//# sourceMappingURL=expressMiddleware.js.map