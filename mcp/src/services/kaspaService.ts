import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ResolvedConfig } from '../types/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// WebSocket polyfill for Node.js (required by Kaspa RPC)
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = require('websocket').w3cwebsocket;
}

// Load the CJS WASM module synchronously
const kaspa = require('../../wasm/kaspa.js');

export function getKaspa(): any {
  return kaspa;
}

/**
 * Create an RPC client based on configuration.
 * Returns the client — caller must connect() and disconnect().
 */
export function createRpcClient(config: ResolvedConfig): any {
  const rpcConfig: any = { networkId: config.network };

  if (config.kaspaNodeUrl) {
    rpcConfig.url = config.kaspaNodeUrl;
  } else {
    rpcConfig.resolver = new kaspa.Resolver();
  }

  return new kaspa.RpcClient(rpcConfig);
}

/**
 * Execute an operation with a short-lived RPC connection.
 * Handles connect/disconnect lifecycle.
 */
export async function withRpcConnection<T>(
  config: ResolvedConfig,
  fn: (rpc: any, networkId: string) => Promise<T>,
): Promise<T> {
  const rpc = createRpcClient(config);
  try {
    await rpc.connect();
    const { networkId } = await rpc.getServerInfo();
    return await fn(rpc, networkId);
  } finally {
    try {
      await rpc.disconnect();
    } catch {
      // ignore disconnect errors
    }
  }
}

/**
 * Derive public key and address from a private key hex string.
 */
export function deriveKeyInfo(privateKeyHex: string, networkId: string): {
  privateKeyObj: any;
  publicKey: string;
  address: any;
} {
  const privateKeyObj = new kaspa.PrivateKey(privateKeyHex);
  const publicKeyObj = privateKeyObj.toPublicKey();
  const publicKey = publicKeyObj.toString();
  const address = publicKeyObj.toAddress(networkId);
  return { privateKeyObj, publicKey, address };
}
