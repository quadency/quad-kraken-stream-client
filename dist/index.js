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

const defaultOptions = {
  msBetweenPings: 5000,
  autoReconnect: false
};

class KrakenStreamClient {
  constructor(correlationId, options) {
    this.correlationId = correlationId;
    this.options = Object.assign(defaultOptions, options);

    this.socket = null;
    this.pingInterval = null;
  }

  onOpen(fn) {
    this.onOpenCB = fn;
  }
  onError(fn) {
    this.onErrorCB = fn;
  }
  onClose(fn) {
    this.onCloseCB = fn;
  }

  static startPings(socket, interval) {
    return setInterval(() => {
      const pingMessage = {
        event: _utils.EVENTS.PING
      };
      socket.send(JSON.stringify(pingMessage));
    }, interval);
  }

  initSocket() {
    return new Promise((resolve, reject) => {
      const socket = new _ws2.default(WEBSOCKET_URI);

      socket.onerror = () => {
        console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection error ${error}`);
        if (this.onErrorCB) {
          this.onErrorCB();
        }
      };

      socket.onclose = () => {
        console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection closed`);
        clearInterval(this.pingInterval);
        if (this.options.autoReconnect) {
          this.reconnect();
        }

        if (this.onCloseCB) {
          this.onCloseCB();
        }
      };

      socket.onmessage = msg => {
        const message = JSON.parse(msg.data);
        if (IGNORE_EVENTS.includes(message.event)) {
          return;
        }
        this.handleMessage(message);
      };

      socket.onopen = () => {
        console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection open`);
        if (this.onOpenCB) {
          this.onOpenCB();
        }
        resolve(socket);
      };
    });
  }

  connect() {
    var _this = this;

    return _asyncToGenerator(function* () {
      _this.socket = yield _this.initSocket();
      _this.ticker = new _ticker2.default(_this.socket);
      _this.trade = new _trade2.default(_this.socket);
      _this.book = new _book2.default(_this.socket);

      _this.pingInterval = KrakenStreamClient.startPings(_this.socket, _this.options.msBetweenPings);
    })();
  }

  reconnect() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      _this2.socket = yield _this2.initSocket();
      _this2.ticker.setSocket(_this2.socket);
      _this2.trade.setSocket(_this2.socket);
      _this2.book.setSocket(_this2.socket);

      _this2.pingInterval = KrakenStreamClient.startPings(_this2.socket, _this2.options.msBetweenPings);
    })();
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