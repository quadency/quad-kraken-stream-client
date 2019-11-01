import { EVENTS } from './utils';

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
      event: EVENTS.SUBSCRIBE,
      subscription: {
        name: this.channelName,
        token: this.authToken,
      },
    };
    this.socket.send(JSON.stringify(subscribeMessage));
  }

  onMessageUpdate(message) {
    const data = this.normalizeMessage(message);
    this.callback(data);
  }
}

export default Channel;
