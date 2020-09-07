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
        }
      };
      this.socket.send(JSON.stringify(subscribeMessage));
    }
  }

  _unSubscribe(pairsToUnSubscribe) {
    while (pairsToUnSubscribe.length) {
      const pairsBatch = pairsToUnSubscribe.splice(0, 100);
      const unSubscribeMessage = {
        event: EVENTS.UNSUBSCRIBE,
        pair: pairsBatch,
        subscription: {
          name: this.channelName,
          ...this.options,
        }
      };
      this.socket.send(JSON.stringify(unSubscribeMessage));
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
      })
    }

    this._subscribe(pairsToSubscribe);
  }

  unSubscribe(pairs) {
    const pairsArray = Array.isArray(pairs) ? pairs : [pairs];
    const toBeRemovedArray = [...pairsArray];
    this._unSubscribe(pairsArray);
    toBeRemovedArray.forEach(pair => {
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
