import Channel from './channel';
import { CHANNELS } from './utils';

class OpenOrders extends Channel {
  constructor(socket, authToken) {
    super(socket, authToken, CHANNELS.ORDERS);
  }

  normalizeMessage(message) {
    return message;
  }
}

export default OpenOrders;
