import WebSocket from 'ws';
import Ticker from './ticker';
import Trade from './trade';
import Book from './book';
import { EVENTS } from './utils';
import { sanitizeChannelName } from './helpers';

const WEBSOCKET_URI = 'wss://ws.kraken.com';
const EXCHANGE = 'KRAKEN';
const IGNORE_EVENTS = [EVENTS.PONG, EVENTS.HEARTBEAT, EVENTS.SYSTEM_STATUS, EVENTS.SUBSCRIPTION_STATUS];

class KrakenStreamClient {
  constructor(correlationId, socket) {
    if (!socket) {
      throw new Error('No Socket');
    }

    this.correlationId = correlationId;
    this.socket = socket;

    this.socket.onmessage = (msg) => {
      const message = JSON.parse(msg.data);
      if (IGNORE_EVENTS.includes(message.event)) {
        return;
      }
      this.handleMessage(message);
    };
    this.socket.onerror = (error) => {
      console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection error ${error}`);
      if (this.onErrorCB) {
        this.onErrorCB();
      }
    };
    this.socket.onclose = () => {
      console.log(`[correlationId=${this.correlationId}] ${EXCHANGE} connection closed`);
      if (this.onCloseCB) {
        this.onCloseCB();
      }
    };

    this.ticker = new Ticker(socket);
    this.trade = new Trade(socket);
    this.book = new Book(socket);
  }

  onError(cb) {
    this.onErrorCB = cb;
  };

  onClose(cb) {
    this.onCloseCB = cb;
  }

  static async createClient(correlationId) {
    const socket = await KrakenStreamClient.initialize(correlationId);
    return new KrakenStreamClient(correlationId, socket);
  }

  static initialize(correlationId) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(WEBSOCKET_URI);
      socket.onopen = () => {
        console.log(`[correlationId=${correlationId}] ${EXCHANGE} connection open`);
        resolve(socket)
      };
    });
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
