'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.events = exports.eventMappings = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.convertFilterData = convertFilterData;
exports.promisify = promisify;
exports.normalizeError = normalizeError;
exports.normalizeArgs = normalizeArgs;

var _feathersCommons = require('feathers-commons');

var eventMappings = exports.eventMappings = {
  create: 'created',
  update: 'updated',
  patch: 'patched',
  remove: 'removed'
};

var events = exports.events = Object.keys(eventMappings).map(function (method) {
  return eventMappings[method];
});

function convertFilterData(obj) {
  return _feathersCommons.hooks.convertHookData(obj);
}

function promisify(method, context) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  return new Promise(function (resolve, reject) {
    method.apply(context, args.concat(function (error, result) {
      if (error) {
        return reject(error);
      }

      resolve(result);
    }));
  });
}

function normalizeError(e) {
  var result = {};

  Object.getOwnPropertyNames(e).forEach(function (key) {
    return result[key] = e[key];
  });

  if (process.env.NODE_ENV === 'production') {
    delete result.stack;
  }

  delete result.hook;

  return result;
}

function normalizeArgs(args) {
  var ret = {};
  if (Array.isArray(args['0'])) {
    var _ret = function () {
      var crt = 0;
      args['0'].forEach(function (val, i) {
        ret[i.toString()] = val;
        crt++;
      });
      ret[crt.toString()] = args[1];
      return {
        v: ret
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  }
  return args;
}