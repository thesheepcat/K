/**
 * Kaspa Network Constants
 *
 * This file defines the available Kaspa networks and provides
 * utility functions for network configuration.
 */

export const KASPA_NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET_10: 'testnet-10',
} as const;

export type KaspaNetwork = typeof KASPA_NETWORKS[keyof typeof KASPA_NETWORKS];

/**
 * Default network for the application
 * Change this value to switch the default network
 */
export const DEFAULT_NETWORK: KaspaNetwork = KASPA_NETWORKS.MAINNET;

/**
 * Get human-readable display name for a network
 */
export const getNetworkDisplayName = (network: KaspaNetwork): string => {
  switch (network) {
    case KASPA_NETWORKS.MAINNET:
      return 'Mainnet';
    case KASPA_NETWORKS.TESTNET_10:
      return 'Testnet 10';
    default:
      return network;
  }
};

/**
 * Get RPC network ID for a network
 * This is the exact string needed for RPC connections
 */
export const getNetworkRPCId = (network: KaspaNetwork): string => {
  return network;
};

/**
 * Validate if a string is a valid Kaspa network
 */
export const isValidNetwork = (network: string): network is KaspaNetwork => {
  return Object.values(KASPA_NETWORKS).includes(network as KaspaNetwork);
};
