import { Request, Response, NextFunction } from 'express';

import { makeExecutableSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import * as Seneca from 'seneca';
import * as GraphiQL from './graphiql/resolveGraphiQLString';
import * as _ from 'lodash';
import * as JSON5 from 'json5';
import * as bodyParser from 'body-parser';


let seneca: any = null;
import { enrichSeneca, runPerRequest,
  IPerRequestResult, applyToDefaultsWithoutCopy } from './common';

export interface ISenegraphExpressOptions {
  schema: any;
  resolvers: any | Array<any>;
  setupSeneca?: Function;
  perRequest?: Promise<object> | Function;
  senecaOptions?: any;
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

  seneca = Seneca(options.senecaOptions);
  enrichSeneca(seneca);

  if (options.setupSeneca) {
    options.setupSeneca(seneca);
  }
  const def: any = {
    typeDefs: options.schema,
    resolvers: options.resolvers,
  };

  const execSchema = makeExecutableSchema(def);

  return function(req: Request, res: Response, next: NextFunction) {
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
  return function(req: Request, res: Response, next: NextFunction) {
    bodyParser.json({})(req, res, () => {
      const query = req.body;
      GraphiQL.resolveGraphiQLString(query, options, req).then((graphiqlString) => {
        res.send(graphiqlString);
        next();
      });
    });
  };
};

_internals.getQueryFromRequest = (request: Request) => {
  if (request.body.query) {
    return request.body.query;
  } else if (request.query.query) {
    return request.query.query;
  }
};

_internals.getVariablesFromRequest = (request: Request) => {
  if (request.body.variables) {
    return request.body.variables;
  } else if (request.query.variables) {
    return request.query.variables;
  }
};

_internals.executeGraphQLQuery = (request: Request, response: Response,
  execSchema: any, userParams: IPerRequestResult, next: NextFunction) => {

  let context = { seneca };
  if (!userParams.context) {
    userParams.context = {};
  }
  context = applyToDefaultsWithoutCopy(context, userParams.context);

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
