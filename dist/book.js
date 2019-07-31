'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _channel = require('./channel');

var _channel2 = _interopRequireDefault(_channel);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Book extends _channel2.default {
  constructor(socket) {
    const options = {
      depth: 100
    };

    super(socket, _utils.CHANNELS.BOOK, options);
  }

  normalizeSnapshot(message) {
    const snapshot = message[1];
    const pair = message.slice(-1)[0];
    const normalized = {
      asks: [],
      bids: [],
      type: 'snapshot',
      pair
    };

    snapshot.as.forEach(ask => {
      const normalizedAsk = {
        price: ask[0],
        volume: ask[1],
        timestamp: ask[2]
      };
      normalized.asks.push(normalizedAsk);
    });
    snapshot.bs.forEach(bid => {
      const normalizedBid = {
        price: bid[0],
        volume: bid[1],
        timestamp: bid[2]
      };
      normalized.bids.push(normalizedBid);
    });

    return normalized;
  }

  normalizeDeltas(message) {
    let asks = [];
    let bids = [];

    if (message.length === 5) {
      asks = message[1].a;
      bids = message[2].b;
    } else {
      if (message[1].a) {
        asks = message[1].a;
      } else {
        bids = message[1].b;
      }
    }

    const pair = message.slice(-1)[0];
    const normalized = {
      asks: [],
      bids: [],
      type: 'delta',
      pair
    };

    asks.forEach(ask => {
      const normalizedAsk = {
        price: ask[0],
        volume: ask[1],
        timestamp: ask[1]
      };
      normalized.asks.push(normalizedAsk);
    });
    bids.forEach(bid => {
      const normalizedBid = {
        price: bid[0],
        volume: bid[1],
        timestamp: bid[2]
      };
      normalized.bids.push(normalizedBid);
    });

    return normalized;
  }

  normalizeMessage(message) {
    if (Object.keys(message[1]).length === 2) {
      return this.normalizeSnapshot(message);
    }
    return this.normalizeDeltas(message);
  }
}

exports.default = Book;