'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _channel = require('./channel');

var _channel2 = _interopRequireDefault(_channel);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
* Balances streams not implemented
* */

class Balances extends _channel2.default {
  constructor(socket, authToken) {
    super(socket, authToken, _utils.CHANNELS.BALANCES);
  }

  normalizeMessage(message) {
    return message;
  }
}

exports.default = Balances;