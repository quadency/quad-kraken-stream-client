'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const EVENTS = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PING: 'ping',
  PONG: 'pong',
  HEARTBEAT: 'heartbeat',
  SYSTEM_STATUS: 'systemStatus',
  SUBSCRIPTION_STATUS: 'subscriptionStatus'
};

const CHANNELS = {
  TICKER: 'ticker',
  OHLC: 'ohlc',
  TRADE: 'trade',
  BOOK: 'book',
  SPREAD: 'spread'
};

exports.EVENTS = EVENTS;
exports.CHANNELS = CHANNELS;