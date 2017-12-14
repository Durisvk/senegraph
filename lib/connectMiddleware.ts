import * as HTTP from 'http';
import * as Connect from 'connect';

import { makeExecutableSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import * as Seneca from 'seneca';
import * as GraphiQL from './graphiql/resolveGraphiQLString';
import * as _ from 'lodash';
import * as JSON5 from 'json5';
import * as bodyParser from 'body-parser';
import * as Promise from 'bluebird';
import { enrichSeneca, runPerRequest,
  IPerRequestResult, applyToDefaultsWithoutCopy } from './common';

import * as url from 'url';

export interface ISenegraphConnectOptions {
  schema: any;
  resolvers: any | Array<any>;
  setupSeneca?: Function;
  perRequest?: Promise<object> | Function;
  senecaOptions?: any;
}

export type ConnectiQLOptions = {
  endpointURL: string,
  subscriptionsEndpoint?: string,
  query?: string,
  variables?: Object,
  operationName?: string,
  result?: Object,
  passHeader?: string,
};

let seneca: any;

const _internals: any = {};

const senegraphConnect = function(options: ISenegraphConnectOptions) {

  seneca = Seneca(options.senecaOptions);
  enrichSeneca(seneca);

  if (options.setupSeneca) {
    options.setupSeneca(seneca);
  }
  const def: any = {
    typeDefs: options.schema,
    resolvers: options.resolvers,
  };

  const execSchema: any = makeExecutableSchema(def);

  return function(req: HTTP.ServerRequest, res: HTTP.ServerResponse, next: any) {
    res.setHeader('Content-Type', 'application/json');
    runPerRequest(options, req, res, seneca)
      .then((userParams: IPerRequestResult) => {
        if (_.isError(userParams)) {
          return res.end(JSON.stringify({ errors: [{ message: 'Failed on perRequest with message: ' + userParams.message }] }));
        }
        bodyParser.json({})(<any>req, <any>res, () => {
          _internals.executeGraphQLQuery(req, res, execSchema, <IPerRequestResult>userParams, next);
        });
      });
  };
};

const connectiql = function(options: ConnectiQLOptions) {
  return function(req: HTTP.ServerRequest, res: HTTP.ServerResponse, next: any) {
    bodyParser.json({})(<any> req, <any> res, () => {
      let query = null;
      if (req.method === 'GET') {
        const q = _internals.getQuery(req);
        query = q.query;
      } else {
        query = (<any>req).body.query;
      }
      GraphiQL.resolveGraphiQLString(query, options, req).then((graphiqlString) => {
        res.end(graphiqlString);
        next();
      });
    });
  };
};

_internals.executeGraphQLQuery = (req: any, res: any, execSchema: any, userParams: IPerRequestResult, next: any) => {
  let context = { seneca };
  if (!userParams.context) {
    userParams.context = {};
  }
  context = applyToDefaultsWithoutCopy(context, userParams.context);

  const rootValue = userParams.rootValue;

  let query = null;
  let vars = null;
  if (req.method === 'GET') {
    const q = _internals.getQuery(req);
    query = q.query;
    vars = q.variables;
  } else {
    query = req.body.query;
    vars = req.body.variables;
  }

  if (typeof vars === 'string') {
    vars = JSON5.parse(vars);
  }
  graphql(execSchema, query, rootValue, context, vars)
    .then((result: any) => {
      res.end(JSON.stringify(result));
      next();
    })
    .catch((err: Error) => {
      console.error(err);
      next();
    });
};

_internals.getQuery = function(req: any) {
  const urlParts = url.parse(req.url, true);
  const query = urlParts.query;
  return query;
};


export { senegraphConnect, connectiql };
