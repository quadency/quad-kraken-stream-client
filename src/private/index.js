import crypto from 'crypto';
import WebSocket from 'ws';
import axios from 'axios';
import Balances from './balances';
import OpenOrders from './openOrders';
import { EVENTS, CHANNELS } from './utils';

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
  const nonceSha256 = crypto.createHash('sha256').update(`${nonce}nonce=${nonce}`).digest();
  const hmac = crypto.createHmac('sha512', decodedSecret)
    .update(apiPath)
    .update(nonceSha256)
    .digest();
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

  setOnOpenHook(fn) { this.onOpenHook = fn; }
  setOnErrorHook(fn) { this.onErrorHook = fn; }
  setOnCloseHook(fn) { this.onCloseHook = fn; }

  static startPings(socket, interval) {
    return setInterval(() => {
      const pingMessage = {
        event: EVENTS.PING,
      };
      socket.send(JSON.stringify(pingMessage));
    }, interval);
  }

  async getAuthToken() {
    const { apiKey, secretKey } = this.options;
    const apiPath = '/0/private/GetWebSocketsToken';
    const nonce = Date.now() * 1000;
    const signature = createSignature(apiPath, secretKey, nonce);

    const options = {
      url: `${REST_URI}${apiPath}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'API-Key': apiKey,
        'API-Sign': signature,
      },
      data: `nonce=${nonce}`
    };

    const res = await axios(options);
    if (res.data.error.length) {
      throw new Error(`Error getting auth token ${res.data.error}`);
    }
    return res.data.result.token
  }

  initSocket() {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(WEBSOCKET_URI);

      socket.onerror = (error) => {
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

      socket.onmessage = (msg) => {
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

  async connect() {
    this.authToken = await this.getAuthToken();
    this.socket = await this.initSocket();
    this.balance = new Balances(this.socket, this.authToken);
    this.openOrders = new OpenOrders(this.socket, this.authToken);

    this.pingInterval = PrivateClient.startPings(this.socket, this.options.msBetweenPings);
  }

  disconnect() {
    Object.values(CHANNELS).forEach(channel => this[channel].unsubscribe());
    clearInterval(this.pingInterval);
    this.pingInterval = null;

    this.socket.terminate();
    this.socket = null;
    this.authToken = null;
    this.options = null;
  }

  handleMessage(message) {
    const [ msgs, channel] = message;

    if (this[channel]) {
      this[channel].onMessageUpdate(msgs);
    }
  }
}

export default PrivateClient;
