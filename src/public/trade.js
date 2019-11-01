import Channel from './channel';
import { CHANNELS } from './utils';

class Trade extends Channel {
  constructor(socket) {
    super(socket, CHANNELS.TRADE);
  }

  normalizeMessage(message) {
    const trades = message[1];
    const pair = message.slice(-1)[0];
    return trades.map(trade => ({
      price: trade[0],
      volume: trade[1],
      time: trade[2],
      side: trade[3],
      pair,
    }));
  }
}

export default Trade;
