import { fetchFromIndexer } from '../../services/indexerClient.js';
import type { ResolvedConfig } from '../../types/config.js';
import type { ToolDefinition } from '../types.js';

export function systemTools(config: ResolvedConfig): ToolDefinition[] {
  return [
    {
      name: 'k_get_health',
      description: 'Check the health and connectivity status of the K-indexer',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async () => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/health', {});
        return JSON.stringify(data, null, 2);
      },
    },
    {
      name: 'k_get_stats',
      description: 'Get overall K network statistics including total counts of posts, users, votes, etc.',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async () => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/stats', {});
        return JSON.stringify(data, null, 2);
      },
    },
    {
      name: 'k_get_users_count',
      description: 'Get the total number of users registered on the K network',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async () => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-users-count', {});
        return JSON.stringify(data, null, 2);
      },
    },
  ];
}
