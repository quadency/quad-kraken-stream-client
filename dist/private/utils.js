'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const EVENTS = {
  PING: 'ping',
  PONG: 'pong',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubcribe'
};

const CHANNELS = {
  BALANCES: 'accountBalancesAndMargins',
  ORDERS: 'openOrders'
};

exports.EVENTS = EVENTS;
exports.CHANNELS = CHANNELS;