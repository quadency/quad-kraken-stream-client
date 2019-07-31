function sanitizeChannelName(channelName) {
  if (channelName.includes('-')) {
    return channelName.split('-')[0];
  }
  return channelName;
}

export { sanitizeChannelName };
