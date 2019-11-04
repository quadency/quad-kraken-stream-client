'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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

      return _extends({
        orderId
      }, orderDetails);
    });
  }
}

exports.default = OpenOrders;