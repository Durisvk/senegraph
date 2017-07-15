"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
function enrichSeneca(seneca) {
    seneca.decorate('actWithPromise', Promise.promisify(seneca.act));
}
exports.enrichSeneca = enrichSeneca;
const _internals = {};
const runPerRequest = function (options, request, reply, seneca) {
    return new Promise((resolve, reject) => {
        if (_.isUndefined(options.perRequest)) {
            resolve({});
            return;
        }
        let promise = null;
        if (_.isFunction(options.perRequest)) {
            let result = null;
            try {
                result = options.perRequest.call(seneca, seneca, request, reply);
            }
            catch (e) {
                promise = Promise.resolve(e);
            }
            if (!_.isNull(result) && !_.isUndefined(result)) {
                if (_internals.isPromise(result)) {
                    promise = result;
                }
                else if (_.isObject(result)) {
                    promise = Promise.resolve(result);
                }
                else if (_.isError(result)) {
                    promise = Promise.resolve(result);
                }
                else {
                    const type = typeof result;
                    return reject(new Error(`Invalid perRequest option type. Should be either Promise<object>,
            Function<Promise<object>> or Function<object>, got: ${type}`));
                }
            }
            else {
                promise = Promise.resolve({});
            }
        }
        else if (_internals.isPromise(options.perRequest)) {
            promise = options.perRequest;
        }
        else {
            const type = typeof options.perRequest;
            return reject(new Error(`Invalid perRequest option type. Should be either Promise<object>,
        Function<Promise<object>> or Function<object>, got: ${type}`));
        }
        promise.then((result) => {
            if (_.isObject(result) || _.isError(result)) {
                resolve(result);
            }
            else {
                const type = typeof result;
                return reject(new Error(`Invalid perRequest option resulting type. Should be either Promise<object>,
          Function<Promise<object>> or Function<object>, got result: ${type}`));
            }
        })
            .catch((err) => {
            if (_.isError(err)) {
                resolve(err);
            }
            else {
                const type = typeof err;
                return reject(new Error(`The rejection should contain Error. Got: ${type}`));
            }
        });
    });
};
exports.runPerRequest = runPerRequest;
const applyToDefaultsWithoutCopy = function (defaults, options) {
    Object.keys(options).map((key) => {
        if (!defaults[key]) {
            defaults[key] = options[key];
        }
    });
    return defaults;
};
exports.applyToDefaultsWithoutCopy = applyToDefaultsWithoutCopy;
_internals.isPromise = function (subj) {
    if (!subj) {
        return false;
    }
    if (subj['then']) {
        return true;
    }
    return false;
};
//# sourceMappingURL=common.js.map