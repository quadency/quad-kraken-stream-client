'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _channel = require('./channel');

var _channel2 = _interopRequireDefault(_channel);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const normalizedToUnormalizedPropsMap = {
  symbol: 'pair',
  type: 'ordertype',
  price: 'price',
  side: 'type',
  stop_price: 'stopprice',
  amount: 'vol',
  filled: 'vol_exec',
  datetime: 'opentm'
};

class OpenOrders extends _channel2.default {
  constructor(socket, authToken) {
    super(socket, authToken, _utils.CHANNELS.ORDERS);
  }

  flattenOrderDetails(orderDetails) {
    if (orderDetails.descr) {
      const { descr } = orderDetails,
            rest = _objectWithoutProperties(orderDetails, ['descr']);
      return Object.assign(rest, _extends({}, descr));
    }

    // ensure return copy
    return JSON.parse(JSON.stringify(orderDetails));
  }

  normalizeMessages(messages) {
    return messages.map(message => {
      const orderId = Object.keys(message)[0];
      const orderDetails = message[orderId];

      const info = _extends({
        id: orderId
      }, orderDetails);

      const flattenedOrderDetails = this.flattenOrderDetails(orderDetails);
      const normalizedMessage = Object.keys(normalizedMessagePropsMap).reduce((normalized, prop) => {
        const unormalizedProp = normalizedToUnormalizedPropsMap[prop];
        if (flattenedOrderDetails[unormalizedProp]) {
          normalized[prop] = flattenedOrderDetails[unormalizedProp];
        }
        return normalized;
      }, {});

      return Object.assign(normalizedMessage, { id: orderId, info });
    });
  }
}

exports.default = OpenOrders;