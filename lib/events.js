'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filterMixin = filterMixin;
exports.defaultDispatcher = defaultDispatcher;
exports.getDispatcher = getDispatcher;
exports.setupEventHandlers = setupEventHandlers;

var _feathersCommons = require('feathers-commons');

var _utils = require('./utils');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var debug = require('debug')('feathers-socket-commons:events');

function filterMixin(service) {
  if (typeof service.filter === 'function' || typeof service.mixin !== 'function') {
    return;
  }

  service.mixin({
    _eventFilters: { all: [] },

    filter: function filter(event, callback) {
      var _this = this;

      var obj = typeof event === 'string' ? _defineProperty({}, event, callback) : event;
      var filterData = (0, _utils.convertFilterData)(obj);

      debug('Adding ' + filterData.length + ' filters for event \'' + event + '\'');

      (0, _feathersCommons.each)(filterData, function (callbacks, event) {
        var filters = _this._eventFilters[event] || (_this._eventFilters[event] = []);
        filters.push.apply(filters, callbacks);
      });

      return this;
    }
  });
}

// The default event dispatcher
function defaultDispatcher(data, params, callback) {
  callback(null, data);
}

function getDispatcher(service, ev, data, hook) {
  var hasLegacy = _utils.events.indexOf(ev) !== -1 && typeof service[ev] === 'function';
  var originalDispatcher = hasLegacy ? service[ev] : defaultDispatcher;
  var eventFilters = (service._eventFilters.all || (service._eventFilters.all = [])).concat(service._eventFilters[ev] || []);

  return function (connection) {
    var promise = (0, _utils.promisify)(originalDispatcher, service, data, connection);

    if (eventFilters.length) {
      debug('Dispatching ' + eventFilters.length + ' event filters for \'' + ev + '\' event');
      eventFilters.forEach(function (filterFn) {
        if (filterFn.length === 4) {
          // function(data, connection, hook, callback)
          promise = promise.then(function (data) {
            if (data) {
              return (0, _utils.promisify)(filterFn, service, data, connection, hook);
            }

            return data;
          });
        } else {
          // function(data, connection, hook)
          promise = promise.then(function (data) {
            if (data) {
              return filterFn.call(service, data, connection, hook);
            }

            return data;
          });
        }
      });
    }

    promise.catch(function (e) {
      return debug('Error in filter chain for \'' + ev + '\' event', e);
    });

    return promise;
  };
}

// Set up event handlers for a given service using the event dispatching mechanism
function setupEventHandlers(info, path, service) {
  // If the service emits events that we want to listen to (Event mixin)
  if (typeof service.on !== 'function' || !service._serviceEvents) {
    return;
  }

  (0, _feathersCommons.each)(service._serviceEvents, function (ev) {
    service.on(ev, function (data, hook) {
      var eventName = path + ' ' + ev;
      var dispatcher = getDispatcher(service, ev, data, hook);

      (0, _feathersCommons.each)(info.clients(), function (socket) {
        var send = socket[info.method].bind(socket);

        dispatcher(info.params(socket)).then(function (data) {
          if (data) {
            debug('Dispatching ' + eventName + ' with data', data);
            send(eventName, data);
          } else {
            debug('Not sending any data for ' + eventName);
          }
        }).catch(function (error) {
          debug('Got error on ' + path, error);
          send(path + ' error', (0, _utils.normalizeError)(error));
        });
      });
    });
  });
}