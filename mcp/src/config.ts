import fs from 'fs';
import path from 'path';
import os from 'os';
import { KMcpConfig, ResolvedConfig, DEFAULT_CONFIG } from './types/config.js';
import { getKaspa } from './services/kaspaService.js';

function loadConfigFile(): Partial<KMcpConfig> {
  const configPath = process.env.K_MCP_CONFIG
    || path.join(os.homedir(), '.k-mcp', 'config.json');

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // Config file is optional — env vars can provide everything
    return {};
  }
}

function deepMerge(target: KMcpConfig, source: Partial<KMcpConfig>): KMcpConfig {
  const result = { ...target };

  if (source.network) result.network = source.network;

  if (source.indexer) {
    result.indexer = { ...result.indexer, ...source.indexer };
  }
  if (source.kaspaNode) {
    result.kaspaNode = { ...result.kaspaNode, ...source.kaspaNode };
  }
  if (source.wallet) {
    result.wallet = { ...result.wallet, ...source.wallet };
  }

  return result;
}

function applyEnvOverrides(config: KMcpConfig): KMcpConfig {
  if (process.env.K_MCP_PRIVATE_KEY) {
    config.wallet.privateKey = process.env.K_MCP_PRIVATE_KEY;
  }
  if (process.env.K_MCP_NETWORK) {
    config.network = process.env.K_MCP_NETWORK as 'mainnet' | 'testnet-10';
  }
  if (process.env.K_MCP_INDEXER_URL) {
    config.indexer.type = 'custom';
    config.indexer.customUrl = process.env.K_MCP_INDEXER_URL;
  }
  if (process.env.K_MCP_NODE_URL) {
    config.kaspaNode.connectionType = 'custom-node';
    config.kaspaNode.customUrl = process.env.K_MCP_NODE_URL;
  }
  return config;
}

function resolveApiBaseUrl(config: KMcpConfig): string {
  if (config.indexer.type === 'custom' && config.indexer.customUrl) {
    return config.indexer.customUrl.replace(/\/+$/, '');
  }
  return config.indexer.url.replace(/\/+$/, '');
}

function resolveKaspaNodeUrl(config: KMcpConfig): string {
  switch (config.kaspaNode.connectionType) {
    case 'public-node':
      return config.kaspaNode.url || 'wss://node.k-social.network';
    case 'custom-node':
      return config.kaspaNode.customUrl;
    case 'resolver':
    default:
      return ''; // empty string triggers resolver-based connection
  }
}

export function loadConfig(): ResolvedConfig {
  const fileConfig = loadConfigFile();
  let config = deepMerge(DEFAULT_CONFIG, fileConfig);
  config = applyEnvOverrides(config);

  if (!config.wallet.privateKey) {
    throw new Error(
      'Private key is required. Set it in the config file (wallet.privateKey) ' +
      'or via K_MCP_PRIVATE_KEY environment variable.'
    );
  }

  // Derive public key from private key
  const kaspa = getKaspa();
  let publicKey: string;
  try {
    const privKeyObj = new kaspa.PrivateKey(config.wallet.privateKey);
    publicKey = privKeyObj.toPublicKey().toString();
  } catch (e: any) {
    throw new Error(`Invalid private key: ${e.message}`);
  }

  return {
    network: config.network,
    apiBaseUrl: resolveApiBaseUrl(config),
    kaspaNodeUrl: resolveKaspaNodeUrl(config),
    privateKey: config.wallet.privateKey,
    publicKey,
  };
}
