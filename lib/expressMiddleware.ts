import * as Express from 'express';

import { makeExecutableSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import * as Seneca from 'seneca';
import * as GraphiQL from './graphiql/resolveGraphiQLString';
import * as _ from 'lodash';
import * as Hoek from 'hoek';
import * as JSON5 from 'json5';
import * as bodyParser from 'body-parser';


const seneca = Seneca();
import { enrichSeneca, runPerRequest, IPerRequestResult } from './common';
enrichSeneca(seneca);

export interface ISenegraphExpressOptions {
  schema: string;
  resolvers: object;
  setupSeneca?: Function;
  perRequest?: Promise<object> | Function;
}

export type ExpressiQLOptions = {
  endpointURL: string,
  subscriptionsEndpoint?: string,
  query?: string,
  variables?: Object,
  operationName?: string,
  result?: Object,
  passHeader?: string,
};


const _internals: any = {};

const senegraphExpress = function(options: ISenegraphExpressOptions) {
  if (options.setupSeneca) {
    options.setupSeneca(seneca);
  }
  const def: any = {
    typeDefs: options.schema,
    resolvers: options.resolvers,
  };

  const execSchema = makeExecutableSchema(def);

  return function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    runPerRequest(options, req, res, seneca)
      .then((userParams: IPerRequestResult | Error) => {
        if (_.isError(userParams)) {
          return res.send({ errors: [{ message: 'Failed on perRequest with message: ' + userParams.message }] });
        }
        bodyParser.json({})(req, res, () => {
          _internals.executeGraphQLQuery(req, res, execSchema, <IPerRequestResult>userParams, next);
        });
      });
  };
};

const expressiql = function(options: ExpressiQLOptions) {
  return function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    bodyParser.json({})(req, res, () => {
      const query = req.body;
      GraphiQL.resolveGraphiQLString(query, options, req).then((graphiqlString) => {
        res.send(graphiqlString);
        next();
      });
    });
  };
};

_internals.getQueryFromRequest = (request: Express.Request) => {
  return request.body.query;
};

_internals.getVariablesFromRequest = (request: Express.Request) => {
  return request.body.variables;
};

_internals.executeGraphQLQuery = (request: Express.Request, response: Express.Response,
  execSchema: any, userParams: IPerRequestResult, next: Express.NextFunction) => {

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
      response.send(result);
      next();
    })
    .catch((err: Error) => {
      console.error(err);
      next();
    });

};

export { senegraphExpress, expressiql };
