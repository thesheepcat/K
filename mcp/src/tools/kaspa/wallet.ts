import { sendKas, getBalance } from '../../services/transactionBuilder.js';
import { getKaspa } from '../../services/kaspaService.js';
import type { ResolvedConfig } from '../../types/config.js';
import type { ToolDefinition } from '../types.js';

export function walletTools(config: ResolvedConfig): ToolDefinition[] {
  return [
    {
      name: 'k_send_kas',
      description: 'Send KAS cryptocurrency to another Kaspa address. Used for tipping other users or transferring funds.',
      inputSchema: {
        type: 'object',
        properties: {
          destinationAddress: { type: 'string', description: 'Kaspa address to send to (e.g., kaspa:qq...)' },
          amountKAS: { type: 'number', description: 'Amount of KAS to send (e.g., 1.5 for 1.5 KAS)' },
        },
        required: ['destinationAddress', 'amountKAS'],
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
      handler: async (args: any) => {
        const result = await sendKas(config, args.destinationAddress, args.amountKAS);
        return JSON.stringify(result, null, 2);
      },
    },
    {
      name: 'k_get_balance',
      description: 'Get the KAS balance and UTXO count for the configured wallet address.',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async () => {
        const result = await getBalance(config);
        return JSON.stringify(result, null, 2);
      },
    },
    {
      name: 'k_get_wallet_info',
      description: 'Get the current wallet\'s public key, address, and network information. Does NOT expose the private key.',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true, openWorldHint: false },
      handler: async () => {
        const kaspa = getKaspa();
        const privateKeyObj = new kaspa.PrivateKey(config.privateKey);
        const publicKey = privateKeyObj.toPublicKey().toString();
        const address = privateKeyObj.toAddress(config.network).toString();
        return JSON.stringify({
          publicKey,
          address,
          network: config.network,
        }, null, 2);
      },
    },
  ];
}
