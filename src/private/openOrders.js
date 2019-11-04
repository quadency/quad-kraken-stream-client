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

      const normalizedOrder = {
        orderId,
        status: orderDetails.status,
      };

      if (orderDetails.descr) {
        // new order
        return Object.assign(normalizedOrder, {
          pair: orderDetails.descr.pair,
          price: orderDetails.descr.price,
          amount: orderDetails.vol,
          side: orderDetails.descr.type,
          type: orderDetails.descr.ordertype,
          openTime: orderDetails.opentm,
        });
      }
      return normalizedOrder;
    });
  }
}

export default OpenOrders;
