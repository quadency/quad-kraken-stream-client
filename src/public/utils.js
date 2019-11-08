const EVENTS = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PING: 'ping',
  PONG: 'pong',
  HEARTBEAT: 'heartbeat',
  SYSTEM_STATUS: 'systemStatus',
  SUBSCRIPTION_STATUS: 'subscriptionStatus',
};

const CHANNELS = {
  TICKER: 'ticker',
  OHLC: 'ohlc',
  TRADE: 'trade',
  BOOK: 'book',
  SPREAD: 'spread',
};

export { EVENTS, CHANNELS };
