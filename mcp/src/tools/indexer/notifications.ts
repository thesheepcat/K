import { fetchFromIndexer, decodeNotification } from '../../services/indexerClient.js';
import type { ResolvedConfig } from '../../types/config.js';
import type { ToolDefinition } from '../types.js';

export function notificationTools(config: ResolvedConfig): ToolDefinition[] {
  return [
    {
      name: 'k_get_notifications_count',
      description: 'Get the number of unread notifications for the current user.',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async () => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-notifications-count', {
          requesterPubkey: config.publicKey,
        });
        return JSON.stringify(data, null, 2);
      },
    },
    {
      name: 'k_get_notifications',
      description: 'Get your notifications feed including mentions, replies, quotes, and votes on your content.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of notifications to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Compound cursor for older notifications' },
          after: { type: 'string', description: 'Compound cursor for newer notifications' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-notifications', {
          requesterPubkey: config.publicKey,
          limit: String(args.limit || 20),
          before: args.before,
          after: args.after,
        });
        if (data.notifications) {
          data.notifications = data.notifications.map(decodeNotification);
        }
        return JSON.stringify(data, null, 2);
      },
    },
  ];
}
