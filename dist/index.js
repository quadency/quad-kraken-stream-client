'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _public = require('./public');

var _public2 = _interopRequireDefault(_public);

var _private = require('./private');

var _private2 = _interopRequireDefault(_private);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const KrakenStreamClient = {
  public: _public2.default,
  private: _private2.default
};

exports.default = KrakenStreamClient;