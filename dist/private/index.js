'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _balances = require('./balances');

var _balances2 = _interopRequireDefault(_balances);

var _openOrders = require('./openOrders');

var _openOrders2 = _interopRequireDefault(_openOrders);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const WEBSOCKET_URI = 'wss://ws-auth.kraken.com';
const REST_URI = 'https://api.kraken.com';
const EXCHANGE = 'KRAKEN';

const defaultOptions = {
  apiKey: '',
  secretKey: '',
  autoReconnect: false,
  msBetweenPings: 5000
};

function createSignature(apiPath, secretKey, nonce) {
  const decodedSecret = Buffer.from(secretKey, 'base64');
  const nonceSha256 = _crypto2.default.createHash('sha256').update(`${nonce}nonce=${nonce}`).digest();
  const hmac = _crypto2.default.createHmac('sha512', decodedSecret).update(apiPath).update(nonceSha256).digest();
  return hmac.toString('base64');
}

class PrivateClient {
  constructor(correlationId, options) {
    this.correlationId = correlationId;

    this.socket = null;
    this.authToken = null;
    this.pingInterval = null;
    this.options = Object.assign(defaultOptions, options);
    if (!this.options.apiKey || !this.options.secretKey) {
      throw new Error('Missing credentials, apiKey and secretKey are required');
    }
  }

  setOnOpenHook(fn) {
    this.onOpenHook = fn;
  }

  setOnErrorHook(fn) {
    this.onErrorHook = fn;
  }

  setOnCloseHook(fn) {
    this.onCloseHook = fn;
  }

  static startPings(socket, interval) {
    return setInterval(() => {
      const pingMessage = {
        event: _utils.EVENTS.PING
      };
      socket.send(JSON.stringify(pingMessage));
    }, interval);
  }

  getAuthToken() {
    var _this = this;

    return _asyncToGenerator(function* () {
      const { apiKey, secretKey } = _this.options;
      const apiPath = '/0/private/GetWebSocketsToken';
      const nonce = Date.now() * 1000;
      const signature = createSignature(apiPath, secretKey, nonce);

      const options = {
        url: `${REST_URI}${apiPath}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'API-Key': apiKey,
          'API-Sign': signature
        },
        data: `nonce=${nonce}`
      };

      const res = yield (0, _axios2.default)(options);
      if (res.data.error.length) {
        throw new Error(`Error getting auth token ${res.data.error}`);
      }
      return res.data.result.token;
    })();
  }

  initSocket() {
    return new Promise(resolve => {
      const socket = new _ws2.default(WEBSOCKET_URI);

      socket.onerror = error => {
        console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection error ${error}`);
        if (this.onErrorHook) {
          this.onErrorHook(error);
        }
      };

      socket.onclose = () => {
        console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection closed`);
        clearInterval(this.pingInterval);
        if (this.options.autoReconnect) {
          this.connect();
        }

        if (this.onCloseHook) {
          this.onCloseHook();
        }
      };

      socket.onmessage = msg => {
        const message = JSON.parse(msg.data);
        if (Array.isArray(message)) {
          this.handleMessage(message);
        }
      };

      socket.onopen = () => {
        console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection open`);
        if (this.onOpenHook) {
          this.onOpenHook();
        }
        resolve(socket);
      };
    });
  }

  connect() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      _this2.authToken = yield _this2.getAuthToken();
      _this2.socket = yield _this2.initSocket();
      _this2.accountBalancesAndMargins = new _balances2.default(_this2.socket, _this2.authToken);
      _this2.openOrders = new _openOrders2.default(_this2.socket, _this2.authToken);

      _this2.pingInterval = PrivateClient.startPings(_this2.socket, _this2.options.msBetweenPings);
    })();
  }

  disconnect() {
    Object.values(_utils.CHANNELS).forEach(channel => this[channel].unsubscribe());
    clearInterval(this.pingInterval);
    this.pingInterval = null;

    this.socket.terminate();
    this.socket = null;
    this.authToken = null;
  }

  handleMessage(message) {
    const [msgs, channel] = message;

    if (this[channel]) {
      this[channel].onMessageUpdate(msgs);
    }
  }
}

exports.default = PrivateClient;