import { hooks } from 'feathers-commons';

export const eventMappings = {
  create: 'created',
  update: 'updated',
  patch: 'patched',
  remove: 'removed'
};

export const events = Object.keys(eventMappings)
  .map(method => eventMappings[method]);

export function convertFilterData (obj) {
  return hooks.convertHookData(obj);
}

export function promisify (method, context, ...args) {
  return new Promise((resolve, reject) => {
    method.apply(context, args.concat(function (error, result) {
      if (error) {
        return reject(error);
      }

      resolve(result);
    }));
  });
}

export function normalizeError (e) {
  let result = {};

  Object.getOwnPropertyNames(e).forEach(key => (result[key] = e[key]));

  if (process.env.NODE_ENV === 'production') {
    delete result.stack;
  }

  delete result.hook;

  return result;
}

export function normalizeArgs (args) {
  let ret = {};
  if (Array.isArray(args['0'])) {
    let crt = 0;
    args['0'].forEach(function (val, i) {
      ret[i.toString()] = val;
      crt++;
    });
    ret[crt.toString()] = args[1];
    return ret;
  }
  return args;
}
