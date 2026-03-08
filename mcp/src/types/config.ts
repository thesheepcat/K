export interface KMcpConfig {
  network: 'mainnet' | 'testnet-10';
  indexer: {
    type: 'public' | 'custom';
    url: string;
    customUrl: string;
  };
  kaspaNode: {
    connectionType: 'resolver' | 'public-node' | 'custom-node';
    url: string;
    customUrl: string;
  };
  wallet: {
    privateKey: string;
  };
}

export interface ResolvedConfig {
  network: 'mainnet' | 'testnet-10';
  apiBaseUrl: string;
  kaspaNodeUrl: string;
  privateKey: string;
  publicKey: string;
}

export const DEFAULT_CONFIG: KMcpConfig = {
  network: 'mainnet',
  indexer: {
    type: 'public',
    url: 'https://mainnet.kaspatalk.net',
    customUrl: '',
  },
  kaspaNode: {
    connectionType: 'resolver',
    url: '',
    customUrl: '',
  },
  wallet: {
    privateKey: '',
  },
};
