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

  onMessageUpdate(messages) {
    const data = this.normalizeMessages(messages);
    this.callback(data);
  }
}

exports.default = Channel;