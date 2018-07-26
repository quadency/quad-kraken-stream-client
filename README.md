# Cryptowatch Node.js Stream Client

This library provides a Node.js client to interact with the Cryptowatch Streaming API.

The Cryptowatch Websocket Streaming API is not public like our [REST API](https://cryptowat.ch/docs/api).
Please [click here](https://docs.google.com/forms/d/e/1FAIpQLSdhv_ceVtKA0qQcW6zQzBniRBaZ_cC4al31lDCeZirntkmWQw/viewform?c=0&w=1)
to inquire about getting access to it.

## Install
TODO: npm module
```
make
```

## Usage
Create a client instance, then set event handlers 

```javascript
const { CWStreamClient, EVENT } = require("cw-client-node");

const client = new CWStreamClient({
  apiKey: 'your-api-key',
  secretKey: 'your-secret-key',
  subscriptions: [
    "markets:86:trades",  // kraken btc:eur
    "markets:87:trades"   // kraken btc:usd
  ]
});

client.onMarketUpdate(marketData => {
  // do something with kraken trades
});

client.onStateChange(newState => {
  // handle different connection states 
})

client.connect();
```

## State
The client exports a `STATE` object, which represents all the states the client can be in. You can add listeners to any of these states: `AUTHENTICATING`, `CONNECTED`, `CONNECTING`, `DISCONNECTED`, and `WAITING_TO_RECONNECT`.

## Errors
The client exports an `ERROR` object, which represents all the errors the client can emit: `BAD_NONCE`, `BAD_TOKEN`, `CONNECTION_REFUSED`, `MISSING_API_KEY`, `MISSING_SECRET_KEY`, `PROTOBUF`, `TOKEN_EXPIRED`, and `UNKNOWN`

## Events
The client exports an `EVENT` object, which represents all the events the client can listen on: `CLIENT_ERROR`, `MARKET_UPDATE`, `PAIR_UPDATE`, `STATE_CHANGE`. Typicically you will want to use the helper methods to add listeners to these events.

**client.onError(fn)**
The client will call `fn` with whatever error was encountered
```javascript
const { ERROR, CWStreamClient } = require("cw-stream-client")
client = new CWStreamClient()

client.onError(err => {
  if (err == ERROR.PROTOBUF) {
    console.log("encountered a protobuf error")
  }
})
```

**client.onMarketUpdate(fn)**
The client will call `fn` whenever a market update is received from the stream.
```javascript
const { CWStreamClient } = require("cw-stream-client")

client = new CWStreamClient({
  subscriptions: [
    "markets:86:trades",  // kraken btc:eur
    "markets:87:trades"   // kraken btc:usd
  ]
})

client.onMarketUpdate(marketUpdate => {
  console.log("market data for btc:eur and btc:usd", marketUpdate)
})
```

Example
```javascript
const { STATE, CWStreamClient } = require("cw-stream-client")

client.on(STATE.AUTHENTICATING, () => {
  console.log("waiting to authenticate")
})
```
### Helper methods

**client.onConnect(fn)**
Connection handler. Calls `fn` when the client successfully connects.

**client.onDisconnect(fn)**
Disconnect handler. Calls `fn` when the client disconnects, for whatever reason.

**client.onStateChange(fn)**
State change handler. Calls `fn` with the new state value. Possible state changes are those in the `STATE` object described above.

## Methods
The following functions are available

**client.connect()**
Initiates connection to websocket api.

## Exports
The package exports the following objects

## Testing
Tests are written using `jest`. Run tests with:
```
make test
```

## License
TODO
