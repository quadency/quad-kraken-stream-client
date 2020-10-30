import Channel from './channel';
import { CHANNELS } from './utils';

const normalizedToUnormalizedPropsMap = {
  symbol: 'pair',
  type: 'ordertype',
  price: 'price',
  side: 'type',
  status: 'status',
  stop_price: 'stopprice',
  amount: 'vol',
  filled: 'vol_exec',
  datetime: 'opentm',
};

class OpenOrders extends Channel {
  constructor(socket, authToken) {
    super(socket, authToken, CHANNELS.ORDERS);
  }

  flattenOrderDetails(orderDetails) {
    if (orderDetails.descr) {
      const { descr, ...rest } = orderDetails;
      return Object.assign(rest, { ...descr });
    }

    // ensure return copy
    return JSON.parse(JSON.stringify(orderDetails));
  }

  normalizeMessages(messages) {
    return messages.map((message) => {
      const orderId = Object.keys(message)[0];
      const orderDetails = message[orderId];

      const info = {
        id: orderId,
        ...orderDetails,
      };

      const flattenedOrderDetails = this.flattenOrderDetails(orderDetails);
      const normalizedMessage = Object.keys(normalizedToUnormalizedPropsMap).reduce((normalized, prop) => {
        const unormalizedProp = normalizedToUnormalizedPropsMap[prop];
        if (flattenedOrderDetails[unormalizedProp]) {
          /* eslint-disable-next-line no-param-reassign */
          normalized[prop] = flattenedOrderDetails[unormalizedProp];
        }
        return normalized;
      }, {});

      return Object.assign(normalizedMessage, { id: orderId, info });
    });
  }
}

export default OpenOrders;
