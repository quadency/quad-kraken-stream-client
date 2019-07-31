import Channel from './channel';
import { CHANNELS } from './utils';

class Ticker extends Channel {
  constructor(socket) {
    super(socket, CHANNELS.TICKER);
  }

  normalizeMessage(message) {
    const ticker = message[1];
    const pair = message.slice(-1)[0];
    return {
      price: ticker.c[0],
      price24Hr: ticker.p[1],
      volume: ticker.v[0],
      high: ticker.h[0],
      low: ticker.l[0],
      pair,
    };
  }
}

export default Ticker;
