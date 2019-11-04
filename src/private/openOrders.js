import Channel from './channel';
import { CHANNELS } from './utils';

class OpenOrders extends Channel {
  constructor(socket, authToken) {
    super(socket, authToken, CHANNELS.ORDERS);
  }

  normalizeMessages(messages) {
    return messages.map((message) => {
      const orderId = Object.keys(message)[0];
      const orderDetails = message[orderId];

      return {
        orderId,
        ...orderDetails
      }
    });
  }
}

export default OpenOrders;
