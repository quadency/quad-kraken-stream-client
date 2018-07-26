import * as Series from "in-series";
import * as Long from "long";
import { Server } from "ws";
import { CWStreamClient, ERROR, IStreamOptions, STATE } from "../src/client";
import {
  AuthenticationResult,
  ClientMessage,
  MarketUpdateMessage,
  OrderBookUpdate,
  PairUpdateMessage,
  PairVwapUpdate,
  StreamMessage
} from "../src/proto-builders";

import { ProtobufClient, ProtobufStream } from "../modules/proto";

const MOCK_SERVER_PORTS = [9999, 9998, 9997, 9996];
const VALID_TOKEN =
  "55v1hv+29RY+xdtJBnFeyoFLjY4r+d8kmx761jCPWi5NgJJPqjPBp5SdqXjrTy/wBoRIcwGAUFVtpGrY7QAOLw==";

function mockServer() {
  const port = MOCK_SERVER_PORTS.shift();
  const wss = new Server({ port });
  return {
    url: `ws://localhost:${port}`,
    wss
  };
}

// Api key pair, nonce, and the valid token
const TEST_OPTS: IStreamOptions = {
  apiKey: "foo",
  nonce: "1531344872326000000",
  reconnect: false,
  secretKey: "YmFy"
};

test("throw error for missing credentials", () => {
  function createStreamWithoutSecretKey(): CWStreamClient {
    return new CWStreamClient({
      apiKey: TEST_OPTS.apiKey,
      secretKey: ""
    });
  }
  function createStreamWithoutApiKey(): CWStreamClient {
    return new CWStreamClient({
      apiKey: "",
      secretKey: TEST_OPTS.secretKey
    });
  }
  expect(createStreamWithoutApiKey).toThrow(ERROR.MISSING_API_KEY);
  expect(createStreamWithoutSecretKey).toThrow(ERROR.MISSING_SECRET_KEY);
});

test("token generation", () => {
  const client = new CWStreamClient({
    apiKey: TEST_OPTS.apiKey,
    secretKey: TEST_OPTS.secretKey
  });
  const token = client.generateToken(TEST_OPTS.nonce);
  expect(token).toBe(VALID_TOKEN);
});

test("connect to stream", done => {
  expect.assertions(11);
  const subscriptions = ["markets:*:summary"];

  // Mocked stream server
  const { wss, url } = mockServer();

  wss.on("connection", ws => {
    ws.on("message", (data: Uint8Array) => {
      // Test initial client authentication message
      const msg: ProtobufClient.ClientMessage = ClientMessage.decode(data);
      expect(msg.apiAuthentication).toBeDefined();
      expect(msg.apiAuthentication.subscriptions).toContain(subscriptions[0]);
      expect(msg.apiAuthentication.nonce).toBe(TEST_OPTS.nonce);
      expect(msg.apiAuthentication.token).toBe(VALID_TOKEN);
      expect(msg.apiAuthentication.apiKey).toBe(TEST_OPTS.apiKey);

      ws.send(
        StreamMessage.encode(
          StreamMessage.create({
            authenticationResult: AuthenticationResult.create({
              status: ProtobufStream.AuthenticationResult.Status.AUTHENTICATED
            })
          })
        ).finish()
      );
    });
  });

  const client = new CWStreamClient(TEST_OPTS);
  client.set("url", url);
  client.set("subscriptions", subscriptions);
  client.set("url", url);

  expect(client.state()).toBe(STATE.WAITING_TO_CONNECT);

  // The states we expect the client to go through, in order
  const expectedStates: STATE[] = [
    STATE.CONNECTING,
    STATE.AUTHENTICATING,
    STATE.CONNECTED,
    STATE.DISCONNECTED
  ];

  client.onStateChange(newState => {
    expect(newState).toBe(expectedStates.shift());
    if (newState === STATE.DISCONNECTED) {
      expect(expectedStates.length).toBe(0);
      wss.close();
      done();
    }
  });

  client.onConnect(() => {
    client.disconnect();
  });

  client.connect();
});

test("handle authentication errors", done => {
  expect.assertions(12);

  const badApiKey = "bad-api-key";
  const badNonce = "bad-nonce";
  const expiredNonce = "expired-nonce";

  const { wss, url } = mockServer();

  wss.on("connection", ws => {
    ws.on("message", (data: Uint8Array) => {
      const msg: ProtobufClient.ClientMessage = ClientMessage.decode(data);
      if (msg.apiAuthentication.apiKey === badApiKey) {
        ws.send(
          StreamMessage.encode(
            StreamMessage.create({
              authenticationResult: AuthenticationResult.create({
                status: ProtobufStream.AuthenticationResult.Status.BAD_TOKEN
              })
            })
          ).finish()
        );
      }

      if (msg.apiAuthentication.nonce === badNonce) {
        ws.send(
          StreamMessage.encode(
            StreamMessage.create({
              authenticationResult: AuthenticationResult.create({
                status: ProtobufStream.AuthenticationResult.Status.BAD_NONCE
              })
            })
          ).finish()
        );
      }

      if (msg.apiAuthentication.nonce === expiredNonce) {
        ws.send(
          StreamMessage.encode(
            StreamMessage.create({
              authenticationResult: AuthenticationResult.create({
                status: ProtobufStream.AuthenticationResult.Status.TOKEN_EXPIRED
              })
            })
          ).finish()
        );
      }

      // This would normally authenticate properly, but we're testing the UNKNOWN error
      if (msg.apiAuthentication.token === VALID_TOKEN) {
        ws.send(
          StreamMessage.encode(
            StreamMessage.create({
              authenticationResult: AuthenticationResult.create({
                status: ProtobufStream.AuthenticationResult.Status.UNKNOWN
              })
            })
          ).finish()
        );
      }
    });
  });

  // Use a series pattern allows us to isolate connections while using the same
  // mocked websocket server
  const series = new Series();

  // Bad token
  series.push(next => {
    const client = new CWStreamClient(TEST_OPTS);
    client.set("apiKey", badApiKey);
    client.set("url", url);

    client.onError(error => {
      expect(error).toBe(ERROR.BAD_TOKEN);
    });

    client.on(ERROR.BAD_TOKEN, msg => {
      expect(msg).toBeUndefined();
    });

    client.on(STATE.DISCONNECTED, () => {
      expect(client.state()).toBe(STATE.DISCONNECTED);
      next();
    });

    client.connect();
  });

  // Bad nonce
  series.push(next => {
    const client = new CWStreamClient(TEST_OPTS);
    client.set("nonce", badNonce);
    client.set("url", url);

    client.onError(error => {
      expect(error).toBe(ERROR.BAD_NONCE);
    });

    client.on(ERROR.BAD_NONCE, msg => {
      expect(msg).toBeUndefined();
    });

    client.on(STATE.DISCONNECTED, () => {
      expect(client.state()).toBe(STATE.DISCONNECTED);
      next();
    });

    client.connect();
  });

  // Expired token
  series.push(next => {
    const client = new CWStreamClient(TEST_OPTS);
    client.set("nonce", expiredNonce);
    client.set("url", url);

    client.onError(error => {
      expect(error).toBe(ERROR.TOKEN_EXPIRED);
    });

    client.on(ERROR.TOKEN_EXPIRED, msg => {
      expect(msg).toBeUndefined();
    });

    client.on(STATE.DISCONNECTED, () => {
      expect(client.state()).toBe(STATE.DISCONNECTED);
      next();
    });

    client.connect();
  });

  // Unknown error
  series.push(next => {
    const client = new CWStreamClient(TEST_OPTS);
    client.set("url", url);

    client.onError(error => {
      expect(error).toBe(ERROR.UNKNOWN);
    });

    client.on(ERROR.UNKNOWN, msg => {
      expect(msg).toBeUndefined();
    });

    client.on(STATE.DISCONNECTED, () => {
      expect(client.state()).toBe(STATE.DISCONNECTED);
      next();
    });

    client.connect();
  });

  series.end(() => {
    wss.close();
    done();
  });
});

test("streaming data", done => {
  expect.assertions(5);

  const REQ_MSG_1 = "send pair update";
  const REQ_MSG_2 = "send market update";
  const REQ_MSG_3 = "send bad proto";

  const { wss, url } = mockServer();

  wss.on("connection", ws => {
    // authenticate autimatically, trigger onConnect
    ws.send(
      StreamMessage.encode(
        StreamMessage.create({
          authenticationResult: AuthenticationResult.create({
            status: ProtobufStream.AuthenticationResult.Status.AUTHENTICATED
          })
        })
      ).finish()
    );
    ws.on("message", (msg: Buffer) => {
      switch (String(msg)) {
        case REQ_MSG_1:
          ws.send(
            StreamMessage.encode(
              StreamMessage.create({
                pairUpdate: PairUpdateMessage.create({
                  pair: 1,
                  vwapUpdate: PairVwapUpdate.create({
                    vwap: 10
                  })
                })
              })
            ).finish()
          );
          break;

        case REQ_MSG_2:
          ws.send(
            StreamMessage.encode(
              StreamMessage.create({
                marketUpdate: MarketUpdateMessage.create({
                  orderBookUpdate: OrderBookUpdate.create()
                })
              })
            ).finish()
          );
          break;

        case REQ_MSG_3:
          ws.send(Buffer.from("bad-proto"));
      }
    });
  });

  const client = new CWStreamClient(TEST_OPTS).set("url", url);

  client.onConnect(() => {
    client.send(Buffer.from(REQ_MSG_1));
  });

  client.onPairUpdate(pairUpdate => {
    expect(pairUpdate.pair.toString()).toBe("1");
    expect(pairUpdate.vwapUpdate.vwap).toBe(10);
    client.send(Buffer.from(REQ_MSG_2));
  });

  client.onMarketUpdate(marketUpdate => {
    expect(marketUpdate.orderBookUpdate.asks.length).toBe(0);
    expect(marketUpdate.orderBookUpdate.bids.length).toBe(0);
    client.send(Buffer.from(REQ_MSG_3));
  });

  client.on(ERROR.PROTOBUF, msg => {
    expect(msg).toBeUndefined();
    wss.close();
    done();
  });

  client.connect();
});

test("connection refused", done => {
  const client = new CWStreamClient(TEST_OPTS).set(
    "url",
    "ws://localhost:9000"
  );
  client.set("reconnect", false);
  client.on(ERROR.CONNECTION_REFUSED, () => {
    done();
  });
  client.connect();
});

jest.useFakeTimers();

test("connection closed, reconnect with backoff", done => {
  const { wss, url } = mockServer();

  wss.on("connection", ws => {
    ws.close();
  });

  const client = new CWStreamClient(TEST_OPTS)
    .set("url", url)
    .set("reconnect", true)
    .set("backoff", true)
    .set("reconnectTimeout", 1)
    .set("maxReconnectTimeout", 30);

  // Using exponential backoff, with a maxReconnectTimeout of 30s, these are the
  // first 7 expected timeouts
  const expectedTimeouts = [1, 2, 4, 8, 16, 30, 30];

  expect.assertions(expectedTimeouts.length);

  client.on(STATE.WAITING_TO_RECONNECT, time => {
    // Ensure the client's reconnectTimeout has been updated with
    // exponential backoff
    expect(client.get("reconnectTimeout")).toBe(expectedTimeouts.shift());

    if (expectedTimeouts.length === 0) {
      wss.close();
      done();
    } else {
      // Advance the mocked setTimeouts
      jest.runOnlyPendingTimers();
    }
  });

  client.connect();
});
