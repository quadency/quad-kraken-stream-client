"use strict";

const { CWStreamClient, EVENT, STATE } = require("../dist/client.js");

// Pass in creds through environment variables
// market 86 = kraken btc:eur
const client = new CWStreamClient({
  subscriptions: ["markets:86:trades"],
  verbose: true
});

// Log all trades to stdout
client.onMarketUpdate(marketUpdateMessage => {
  console.log(marketUpdateMessage.tradesUpdate.trades);
});

client.onConnect(() => {
  console.info("streaming trades for the next 15 seconds...");
  setTimeout(() => {
    client.disconnect();
  }, 15 * 1000);
});

client.connect();
