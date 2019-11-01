import crypto from 'crypto';
import WebSocket from 'ws';
import axios from 'axios';

const WEBSOCKET_URI = 'wss://ws-auth.kraken.com';
const REST_URI = 'https://api.kraken.com';
const EXCHANGE = 'KRAKEN';

const defaultOptions = {
  apiKey: '',
  secretKey: ''
};

function createSignature(apiPath, secretKey, nonce) {
  const decodedSecret = Buffer.from(secretKey, 'base64');
  const nonceSha256 = crypto.createHash('sha256').update(`${nonce}nonce=${nonce}`).digest();
  const hmac = crypto.createHmac('sha512', decodedSecret)
    .update(apiPath)
    .update(nonceSha256)
    .digest();
  return hmac.toString('base64');
}

class PrivateClient {
  constructor(correlationId, options) {
    this.correlationId = correlationId;

    this.socket = null;
    this.authToken = null;
    this.pingInterval = null;
    this.options = Object.assign(defaultOptions, options);
    if (!this.options.apiKey || !this.options.secretKey) {
      throw new Error('Missing credentials, apiKey and secretKey are required');
    }
  }

  async getAuthToken() {
    const { apiKey, secretKey } = this.options;
    const apiPath = '/0/private/GetWebSocketsToken';
    const nonce = Date.now() * 1000;
    const signature = createSignature(apiPath, secretKey, nonce);

    const options = {
      url: `${REST_URI}${apiPath}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'API-Key': apiKey,
        'API-Sign': signature,
      },
      data: `nonce=${nonce}`
    };

    const res = await axios(options);
    if (res.data.error.length) {
      throw new Error(`Error getting auth token ${res.data.error}`);
    }
    return res.data
  }

  async connect() {
    this.authToken = await this.getAuthToken();
    console.log(this.authToken);
  }
}

export default PrivateClient;
