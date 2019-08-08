import WebSocket from 'ws';
import Ticker from './ticker';
import Trade from './trade';
import Book from './book';
import { EVENTS } from './utils';
import { sanitizeChannelName } from './helpers';

const WEBSOCKET_URI = 'wss://ws.kraken.com';
const EXCHANGE = 'KRAKEN';
const IGNORE_EVENTS = [EVENTS.PONG, EVENTS.HEARTBEAT, EVENTS.SYSTEM_STATUS, EVENTS.SUBSCRIPTION_STATUS];

const defaultOptions = {
  msBetweenPings: 5000,
  autoReconnect: false
}

class KrakenStreamClient {
  constructor(correlationId, options) {
    this.correlationId = correlationId;
    this.options = Object.assign(defaultOptions, options);

    this.socket = null;
    this.pingInterval = null;
  }

  onOpen(fn) { this.onOpenCB = fn; }
  onError(fn) { this.onErrorCB = fn; }
  onClose (fn) { this.onCloseCB = fn; }

  static startPings(socket, interval) {
    return setInterval(() => {
      const pingMessage = {
        event: EVENTS.PING,
      };
      socket.send(JSON.stringify(pingMessage));
    }, interval)
  }

  initSocket() {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(WEBSOCKET_URI);

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

      socket.onmessage = (msg) => {
        const message = JSON.parse(msg.data);
        if (IGNORE_EVENTS.includes(message.event)) {
          return;
        }
        this.handleMessage(message);
      }

      socket.onopen = () => {
        console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection open`);
        if (this.onOpenCB) {
          this.onOpenCB();
        }
        resolve(socket);
      }
    });
  }

  async connect() {
    this.socket = await this.initSocket();
    this.ticker = new Ticker(this.socket);
    this.trade = new Trade(this.socket);
    this.book = new Book(this.socket);

    this.pingInterval = KrakenStreamClient.startPings(this.socket, this.options.msBetweenPings);
  }

  async reconnect() {
    this.socket = await this.initSocket();
    this.ticker.setSocket(this.socket);
    this.trade.setSocket(this.socket);
    this.book.setSocket(this.socket);

    this.pingInterval = KrakenStreamClient.startPings(this.socket, this.options.msBetweenPings);
  }

  handleMessage(message) {
    const [channelName] = message.slice(-2, -1);
    const sanitizedChannelName = sanitizeChannelName(channelName);
    if (this[sanitizedChannelName]) {
      this[sanitizedChannelName].onMessageUpdate(message);
    }
  }
}

export default KrakenStreamClient;
