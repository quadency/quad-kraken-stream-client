# quad-kraken-stream-client

## Example
```$xslt
import KrakenStreamClient from 'kraken-stream-client';

async function main() {
  const client = new KrakenStreamClient.public('EXAMPLE', { autoReconnect: true  });
  await client.connect();
  client.book.subscribe('XBT/USD', (msg) => console.log(msg));
}

main();
```

## Options
```$xslt
{
  autoReconnect: <boolean> // automatically reconnect on socket close, defaults to false
  msBetweenPings: <Number> // milliseconds between consecutive pings, defaults to 5000ms (5s)
}
```

## Channels
```$xslt
ticker
trade
book
```
