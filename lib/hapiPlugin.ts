import { Server, Response, Request, ReplyNoContinue, HTTP_METHODS_PARTIAL} from 'hapi';
import { makeExecutableSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import * as Seneca from 'seneca';
import * as GraphiQL from './graphiql/resolveGraphiQLString';
import * as _ from 'lodash';

import * as JSON5 from 'json5';

const seneca = Seneca();
import { enrichSeneca, runPerRequest, IPerRequestResult } from './common';
enrichSeneca(seneca);

import * as Promise from 'bluebird';

import * as Hoek from 'hoek';

const _internals: any = {};

export interface IRegister {
  (server: Server, options: any, next: Function): void;
  attributes?: any;
}

export interface ISenegraphHapiOptions {
  schema: string;
  resolvers: object;
  setupSeneca?: Function;
  path?: string;
  methods?: HTTP_METHODS_PARTIAL | '*' | (HTTP_METHODS_PARTIAL | '*')[];
  perRequest?: Promise<object> | Function;
}

export interface IHapiQLOptions {
  path?: string;
  hapiqlOptions: GraphiQL.GraphiQLData;
}

const senegraphHapi: IRegister = function(server: Server, options: ISenegraphHapiOptions, next: Function) {

  if (!options) {
    throw new Error('senegraph requires options. At least provide schema and resolvers.');
  }

  if (arguments.length !== 3) {
    throw new Error(`Senegraph expects exactly 3 arguments, got ${arguments.length}`);
  }

  let setupSenecaResult: any = null;
  if (options.setupSeneca) {
    setupSenecaResult = options.setupSeneca.call(seneca, seneca);
  }

  _internals.setupGraphQLRoute(server, options);

  if (setupSenecaResult && _internals.isPromise(setupSenecaResult)) {
    setupSenecaResult.then(() => next());
  } else {
    next();
  }
};

senegraphHapi.attributes = {
  name: 'senegraph',
  version: '0.0.8',
  pkg: require('../package.json'),
};

const hapiql: IRegister = function(server: Server, options: IHapiQLOptions, next: Function) {
  if (!options || !options.hapiqlOptions) {
    throw new Error('hapiql(GraphiQL) requires options. At least provide endpointURL');
  }

  if (arguments.length !== 3) {
    throw new Error(`HapiQL expects exactly 3 arguments, got ${arguments.length}`);
  }

  _internals.setupGraphiQLRoute(server, options);

  next();
};

hapiql.attributes = {
  name: 'hapiql',
  version: '0.0.8',
  pkg: require('../package.json'),
};

_internals.isPromise = function(subj: any) {
  if (!subj) {
    return false;
  }
  if (subj['then']) {
    return true;
  }
  return false;
};

_internals.setupGraphQLRoute = function(server: Server, options: ISenegraphHapiOptions) {
  const def: any = {
    typeDefs: options.schema,
    resolvers: options.resolvers,
  };

  const execSchema = makeExecutableSchema(def);

  server.route({
    path: options.path || '/graphql',
    method: options.methods || ['POST', 'GET'],
    handler: (request: Request, reply: ReplyNoContinue) => {
      runPerRequest(options, request, reply, seneca)
        .then((userParams: IPerRequestResult | Error) => {
          if (_.isError(userParams)) {
            return reply({ errors: [{ message: 'Failed on perRequest with message: ' + userParams.message }] });
          }
          _internals.executeGraphQLQuery(request, reply, execSchema, <IPerRequestResult>userParams);
        })
        .catch((err: Error) => { throw err; });
    },
  });
};

_internals.setupGraphiQLRoute = function(server: Server, options: IHapiQLOptions) {
  server.route({
    path: options.path || '/graphiql',
    method: 'GET',
    handler: (request: Request, reply: ReplyNoContinue) => {
      const query = request.query;
      GraphiQL.resolveGraphiQLString(query, options.hapiqlOptions, request).then(graphiqlString => {
        reply(graphiqlString).header('Content-Type', 'text/html');
      }, error => reply(error));
    },
  });
};

_internals.getQueryFromRequest = function(request: Request) {
  if (request.payload && Object.keys(request.payload).length > 0 && request.payload.query) {
    return request.payload.query;
  } else if (request.query && Object.keys(request.query).length > 0 && request.query.query) {
    return request.query.query;
  } else {
    return {};
  }
};

_internals.getVariablesFromRequest = function(request: Request) {
  if (request.payload && Object.keys(request.payload).length > 0 && request.payload.variables) {
    return request.payload.variables;
  } else if (request.query && Object.keys(request.query).length > 0 && request.query.variables) {
    return request.query.variables;
  } else {
    return {};
  }
};

_internals.executeGraphQLQuery = function(request: Request, reply: ReplyNoContinue, execSchema: any, userParams: IPerRequestResult) {
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
  graphql(execSchema, query, rootValue, context, vars)
    .then((result: any) => {
      reply(result);
    })
    .catch(console.error);
};

export { senegraphHapi, hapiql };
