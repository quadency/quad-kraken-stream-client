'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _channel = require('./channel');

var _channel2 = _interopRequireDefault(_channel);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Trade extends _channel2.default {
  constructor(socket) {
    super(socket, _utils.CHANNELS.TRADE);
  }

  normalizeMessage(message) {
    const trades = message[1];
    const pair = message.slice(-1)[0];
    return trades.map(trade => ({
      price: trade[0],
      volume: trade[1],
      time: trade[2],
      side: trade[3],
      pair
    }));
  }
}

exports.default = Trade;