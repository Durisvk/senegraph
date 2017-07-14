"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const renderGraphiQL_1 = require("./renderGraphiQL");
function isOptionsFunction(arg) {
    return typeof arg === 'function';
}
function resolveGraphiQLOptions(options, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isOptionsFunction(options)) {
            try {
                return yield options(...args);
            }
            catch (e) {
                throw new Error(`Invalid options provided for GraphiQL: ${e.message}`);
            }
        }
        else {
            return options;
        }
    });
}
function createGraphiQLParams(query = {}) {
    return {
        query: query.query || '',
        variables: query.variables,
        operationName: query.operationName || '',
    };
}
function createGraphiQLData(params, options) {
    return {
        endpointURL: options.endpointURL,
        subscriptionsEndpoint: options.subscriptionsEndpoint,
        query: params.query || options.query,
        variables: params.variables && JSON.parse(params.variables) || options.variables,
        operationName: params.operationName || options.operationName,
        passHeader: options.passHeader,
    };
}
function resolveGraphiQLString(query = {}, options, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        const graphiqlParams = createGraphiQLParams(query);
        const graphiqlOptions = yield resolveGraphiQLOptions(options, ...args);
        const graphiqlData = createGraphiQLData(graphiqlParams, graphiqlOptions);
        return renderGraphiQL_1.renderGraphiQL(graphiqlData);
    });
}
exports.resolveGraphiQLString = resolveGraphiQLString;
//# sourceMappingURL=resolveGraphiQLString.js.map