import * as Promise from 'bluebird';

import * as _ from 'lodash';

export function enrichSeneca(seneca: any) {
  seneca.decorate('actWithPromise', Promise.promisify(seneca.act));
}

export interface IPerRequestResult {
  context?: object;
  rootValue?: object;
}

const _internals: any = {};

const runPerRequest = function(options: any, request: any, reply: any, seneca: any): Promise<Error | IPerRequestResult> {
  return new Promise((resolve, reject) => {
    if (_.isUndefined(options.perRequest)) {
      resolve({});
      return;
    }

    let promise = null;
    if (_.isFunction(options.perRequest)) {
      let result = null;
      try {
        result = (<Function>options.perRequest).call(seneca, seneca, request, reply);
      } catch (e) {
        promise = Promise.resolve(e);
      }
      if (!_.isNull(result) && !_.isUndefined(result)) {
        if (_internals.isPromise(result)) {
          promise = result;
        } else if (_.isObject(result)) {
          promise = Promise.resolve(result);
        } else if (_.isError(result)) {
          promise = Promise.resolve(result);
        } else {
          const type = typeof result;
          return reject(new Error(`Invalid perRequest option type. Should be either Promise<object>,
            Function<Promise<object>> or Function<object>, got: ${type}`));
        }
      } else {
        promise = Promise.resolve({});
      }
    } else if (_internals.isPromise(options.perRequest)) {
      promise = options.perRequest;
    } else {
      const type = typeof options.perRequest;
      return reject(new Error(`Invalid perRequest option type. Should be either Promise<object>,
        Function<Promise<object>> or Function<object>, got: ${type}`));
    }

    promise.then((result: object) => {
      if (_.isObject(result) || _.isError(result)) {
        resolve(result);
      } else {
        const type = typeof result;
        return reject(new Error(`Invalid perRequest option resulting type. Should be either Promise<object>,
          Function<Promise<object>> or Function<object>, got result: ${type}`));
      }
    })
      .catch((err: Error) => {
        if (_.isError(err)) {
          resolve(err);
        } else {
          const type = typeof err;
          return reject(new Error(`The rejection should contain Error. Got: ${type}`));
        }
      });
  });
};

const applyToDefaultsWithoutCopy = function(defaults: any, options: any) {
  Object.keys(options).map((key) => {
    if (!defaults[key]) {
      defaults[key] = options[key];
    }
  });
  return defaults;
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


export { runPerRequest, applyToDefaultsWithoutCopy };
