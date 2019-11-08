import PublicClient from './public';
import PrivateClient from './private';

const KrakenStreamClient = {
  public: PublicClient,
  private: PrivateClient,
};

export default KrakenStreamClient;
