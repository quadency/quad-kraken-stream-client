import Channel from './channel';
import { CHANNELS } from './utils';

/*
* Balances streams not implemented
* */

class Balances extends Channel {
  constructor(socket, authToken) {
    super(socket, authToken, CHANNELS.BALANCES);
  }

  /* eslint-disable-next-line class-methods-use-this */
  normalizeMessage(message) {
    return message;
  }
}

export default Balances;
