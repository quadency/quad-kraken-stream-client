'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function sanitizeChannelName(channelName) {
  if (channelName.includes('-')) {
    return channelName.split('-')[0];
  }
  return channelName;
}

exports.sanitizeChannelName = sanitizeChannelName;