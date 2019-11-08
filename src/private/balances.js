import Channel from './channel';
import { CHANNELS } from './utils';

/*
* Balances streams not implemented
* */

class Balances extends Channel {
  constructor(socket, authToken) {
    super(socket, authToken, CHANNELS.BALANCES);
  }

  normalizeMessage(message) {
    return message;
  }
}

export default Balances;
