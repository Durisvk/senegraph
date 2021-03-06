"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tools_1 = require("graphql-tools");
const graphql_1 = require("graphql");
const Seneca = require("seneca");
const GraphiQL = require("./graphiql/resolveGraphiQLString");
const _ = require("lodash");
const JSON5 = require("json5");
const bodyParser = require("body-parser");
let seneca = null;
const common_1 = require("./common");
const _internals = {};
const senegraphExpress = function (options) {
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
    if (request.body.query) {
        return request.body.query;
    }
    else if (request.query.query) {
        return request.query.query;
    }
};
_internals.getVariablesFromRequest = (request) => {
    if (request.body.variables) {
        return request.body.variables;
    }
    else if (request.query.variables) {
        return request.query.variables;
    }
};
_internals.executeGraphQLQuery = (request, response, execSchema, userParams, next) => {
    let context = { seneca };
    if (!userParams.context) {
        userParams.context = {};
    }
    context = common_1.applyToDefaultsWithoutCopy(context, userParams.context);
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