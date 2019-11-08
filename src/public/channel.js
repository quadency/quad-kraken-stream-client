import { EVENTS } from './utils';

class Channel {
  constructor(socket, channelName, options = {}) {
    this.socket = socket;
    this.channelName = channelName;
    this.pairListeners = new Map();
    this.options = options;
  }

  subscribe(pairs, callback, resubscribe = false) {
    const pairsArray = Array.isArray(pairs) ? pairs : [pairs];

    let pairsToSubscribe = [];
    if (resubscribe) {
      pairsToSubscribe = pairsArray;
    } else {
      pairsArray.forEach((pair) => {
        if (!this.pairListeners.has(pair)) {
          pairsToSubscribe.push(pair);
          this.pairListeners.set(pair, []);
        }
        this.pairListeners.get(pair).push(callback);
      });
    }

    const subscribeMessage = {
      event: EVENTS.SUBSCRIBE,
      pair: pairsToSubscribe,
      subscription: {
        name: this.channelName,
        ...this.options,
      },
    };

    this.socket.send(JSON.stringify(subscribeMessage));
  }

  setSocket(socket) {
    this.socket = socket;
    const pairs = Array.from(this.pairListeners.keys());
    this.subscribe(pairs, null, true);
  }

  onMessageUpdate(message) {
    const [pair] = message.slice(-1);
    if (this.pairListeners.has(pair)) {
      const data = this.normalizeMessage(message);
      this.pairListeners.get(pair).forEach(fn => fn(data));
    }
  }
}

export default Channel;
