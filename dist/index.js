'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _ticker = require('./ticker');

var _ticker2 = _interopRequireDefault(_ticker);

var _trade = require('./trade');

var _trade2 = _interopRequireDefault(_trade);

var _book = require('./book');

var _book2 = _interopRequireDefault(_book);

var _utils = require('./utils');

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const WEBSOCKET_URI = 'wss://ws.kraken.com';
const EXCHANGE = 'KRAKEN';
const IGNORE_EVENTS = [_utils.EVENTS.PONG, _utils.EVENTS.HEARTBEAT, _utils.EVENTS.SYSTEM_STATUS, _utils.EVENTS.SUBSCRIPTION_STATUS];

class KrakenStreamClient {
  constructor(correlationId, socket) {
    if (!socket) {
      throw new Error('No Socket');
    }

    this.correlationId = correlationId;
    this.socket = socket;
    this.pingInterval = KrakenStreamClient.startPings(this.socket);

    this.socket.onmessage = msg => {
      const message = JSON.parse(msg.data);
      if (IGNORE_EVENTS.includes(message.event)) {
        return;
      }
      this.handleMessage(message);
    };
    this.socket.onerror = error => {
      console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection error ${error}`);
      clearInterval(this.pingInterval);
      if (this.onErrorCB) {
        this.onErrorCB();
      }
    };
    this.socket.onclose = () => {
      console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection closed`);
      clearInterval(this.pingInterval);
      if (this.onCloseCB) {
        this.onCloseCB();
      }
    };

    this.ticker = new _ticker2.default(socket);
    this.trade = new _trade2.default(socket);
    this.book = new _book2.default(socket);
  }

  onError(cb) {
    this.onErrorCB = cb;
  }

  onClose(cb) {
    this.onCloseCB = cb;
  }

  static createClient(correlationId) {
    return _asyncToGenerator(function* () {
      const socket = yield KrakenStreamClient.connect(correlationId);
      return new KrakenStreamClient(correlationId, socket);
    })();
  }

  static connect(correlationId) {
    return new Promise((resolve, reject) => {
      const socket = new _ws2.default(WEBSOCKET_URI);
      socket.onopen = () => {
        console.log(`[correlationId=${correlationId}] ${EXCHANGE} connection open`);
        resolve(socket);
      };
    });
  }

  static startPings(socket) {
    return setInterval(() => {
      const pingMessage = {
        event: _utils.EVENTS.PING
      };
      socket.send(JSON.stringify(pingMessage));
    }, 5000);
  }

  handleMessage(message) {
    const [channelName] = message.slice(-2, -1);
    const sanitizedChannelName = (0, _helpers.sanitizeChannelName)(channelName);
    if (this[sanitizedChannelName]) {
      this[sanitizedChannelName].onMessageUpdate(message);
    }
  }
}

exports.default = KrakenStreamClient;