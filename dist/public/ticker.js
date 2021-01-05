'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _channel = require('./channel');

var _channel2 = _interopRequireDefault(_channel);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Ticker extends _channel2.default {
  constructor(socket) {
    super(socket, _utils.CHANNELS.TICKER);
  }

  normalizeMessage(message) {
    const ticker = message[1];
    const pair = message.slice(-1)[0];
    const price = ticker.c[0];
    return {
      price,
      price24Hr: ticker.p[1],
      volume: ticker.v[1] * price,
      high: ticker.h[0],
      low: ticker.l[0],
      pair
    };
  }
}

exports.default = Ticker;