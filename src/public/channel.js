import { EVENTS } from './utils';

class Channel {
  constructor(socket, channelName, options = {}) {
    this.socket = socket;
    this.channelName = channelName;
    this.pairListeners = new Map();
    this.options = options;
  }

  _subscribe(pairsToSubscribe) {
    while (pairsToSubscribe.length) {
      const pairsBatch = pairsToSubscribe.splice(0, 100);
      const subscribeMessage = {
        event: EVENTS.SUBSCRIBE,
        pair: pairsBatch,
        subscription: {
          name: this.channelName,
          ...this.options,
        },
      };
      if (this.socket.readyState === this.socket.OPEN) {
        this.socket.send(JSON.stringify(subscribeMessage));
      }
    }
  }

  _unsubscribe(pairsToUnsubscribe) {
    while (pairsToUnsubscribe.length) {
      const pairsBatch = pairsToUnsubscribe.splice(0, 100);
      const unsubscribeMessage = {
        event: EVENTS.UNSUBSCRIBE,
        pair: pairsBatch,
        subscription: {
          name: this.channelName,
          ...this.options,
        },
      };
      this.socket.send(JSON.stringify(unsubscribeMessage));
    }
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

    this._subscribe(pairsToSubscribe);
  }

  unsubscribe(pairs) {
    const pairsArray = Array.isArray(pairs) ? pairs : [pairs];
    const toBeRemovedArray = [...pairsArray];
    this._unsubscribe(pairsArray);
    toBeRemovedArray.forEach((pair) => {
      if (this.pairListeners.has(pair)) {
        this.pairListeners.delete(pair);
      }
    });
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
