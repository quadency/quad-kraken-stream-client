import Channel from './channel';
import { CHANNELS } from './utils';

class Book extends Channel {
  constructor(socket) {
    const options = {
      depth: 100,
    };

    super(socket, CHANNELS.BOOK, options);
  }

  normalizeSnapshot(message) {
    const snapshot = message[1];
    const pair = message.slice(-1)[0];
    const normalized = {
      asks: [],
      bids: [],
      type: 'snapshot',
      pair,
    };

    snapshot.as.forEach((ask) => {
      const normalizedAsk = {
        price: ask[0],
        volume: ask[1],
        timestamp: ask[2],
      };
      normalized.asks.push(normalizedAsk);
    });
    snapshot.bs.forEach((bid) => {
      const normalizedBid = {
        price: bid[0],
        volume: bid[1],
        timestamp: bid[2],
      };
      normalized.bids.push(normalizedBid);
    });

    return normalized;
  }

  normalizeDeltas(message) {
    let asks = [];
    let bids = [];

    const [, deltas] = message;
    if (deltas.a) {
      asks = deltas.a;
    }
    if (deltas.b) {
      bids = deltas.b;
    }

    const pair = message.slice(-1)[0];
    const normalized = {
      asks: [],
      bids: [],
      type: 'delta',
      pair,
    };

    asks.forEach((ask) => {
      const normalizedAsk = {
        price: ask[0],
        volume: ask[1],
        timestamp: ask[2],
      };
      normalized.asks.push(normalizedAsk);
    });
    bids.forEach((bid) => {
      const normalizedBid = {
        price: bid[0],
        volume: bid[1],
        timestamp: bid[2],
      };
      normalized.bids.push(normalizedBid);
    });

    return normalized;
  }

  normalizeMessage(message) {
    if (message[1].as && message[1].bs) {
      return this.normalizeSnapshot(message);
    }
    return this.normalizeDeltas(message);
  }
}

export default Book;
