'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = require('./utils');

class Channel {
  constructor(socket, authToken, channelName) {
    this.socket = socket;
    this.authToken = authToken;
    this.channelName = channelName;
    this.callback = null;
  }

  subscribe(callback) {
    if (!callback) {
      throw new Error('No callback provided to subscribe');
    }

    this.callback = callback;
    const subscribeMessage = {
      event: _utils.EVENTS.SUBSCRIBE,
      subscription: {
        name: this.channelName,
        token: this.authToken
      }
    };
    this.socket.send(JSON.stringify(subscribeMessage));
  }

  unsubscribe() {
    if (this.callback) {
      const unsubscribeMessage = {
        event: _utils.EVENTS.UNSUBSCRIBE,
        subscription: {
          name: this.channelName
        }
      };
      this.socket.send(JSON.stringify(unsubscribeMessage));
      this.callback = null;
    }
  }

  onMessageUpdate(messages) {
    const data = this.normalizeMessages(messages);
    this.callback(data);
  }
}

exports.default = Channel;