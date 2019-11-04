'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _channel = require('./channel');

var _channel2 = _interopRequireDefault(_channel);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class OpenOrders extends _channel2.default {
  constructor(socket, authToken) {
    super(socket, authToken, _utils.CHANNELS.ORDERS);
  }

  normalizeMessages(messages) {
    return messages.map(message => {
      const orderId = Object.keys(message)[0];
      const orderDetails = message[orderId];

      const normalizedOrder = {
        orderId,
        status: orderDetails.status
      };

      if (orderDetails.descr) {
        // new order
        return Object.assign(normalizedOrder, {
          pair: orderDetails.descr.pair,
          price: orderDetails.descr.price,
          amount: orderDetails.vol,
          side: orderDetails.descr.type,
          type: orderDetails.descr.ordertype,
          openTime: orderDetails.opentm
        });
      }
      return normalizedOrder;
    });
  }
}

exports.default = OpenOrders;