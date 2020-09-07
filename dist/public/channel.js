'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _utils = require('./utils');

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
        event: _utils.EVENTS.SUBSCRIBE,
        pair: pairsBatch,
        subscription: _extends({
          name: this.channelName
        }, this.options)
      };
      this.socket.send(JSON.stringify(subscribeMessage));
    }
  }

  _unSubscribe(pairsToUnSubscribe) {
    while (pairsToUnSubscribe.length) {
      const pairsBatch = pairsToUnSubscribe.splice(0, 100);
      const unSubscribeMessage = {
        event: _utils.EVENTS.UNSUBSCRIBE,
        pair: pairsBatch,
        subscription: _extends({
          name: this.channelName
        }, this.options)
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
      pairsArray.forEach(pair => {
        if (!this.pairListeners.has(pair)) {
          pairsToSubscribe.push(pair);
          this.pairListeners.set(pair, []);
        }
        this.pairListeners.get(pair).push(callback);
      });
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

exports.default = Channel;