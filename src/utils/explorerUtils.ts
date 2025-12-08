import { KASPA_NETWORKS, type KaspaNetwork } from '@/constants/networks';

/**
 * Get explorer transaction URL based on selected network
 */
export const getExplorerTransactionUrl = (txId: string, network: KaspaNetwork): string => {
  if (network === KASPA_NETWORKS.MAINNET) {
    return `https://kaspa.stream/transactions/${txId}`;
  } else {
    return `https://tn10.kaspa.stream/transactions/${txId}`;
  }
};

/**
 * Get explorer address URL based on selected network
 */
export const getExplorerAddressUrl = (address: string, network: KaspaNetwork): string => {
  if (network === KASPA_NETWORKS.MAINNET) {
    return `https://kaspa.stream/addresses/${address}`;
  } else {
    return `https://tn10.kaspa.stream/addresses/${address}`;
  }
};
