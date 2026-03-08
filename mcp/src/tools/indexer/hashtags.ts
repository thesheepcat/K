import { fetchFromIndexer, decodePosts } from '../../services/indexerClient.js';
import type { ResolvedConfig } from '../../types/config.js';
import type { ToolDefinition } from '../types.js';

export function hashtagTools(config: ResolvedConfig): ToolDefinition[] {
  return [
    {
      name: 'k_get_hashtag_content',
      description: 'Get all posts, replies, and quotes containing a specific hashtag. Hashtag should be provided without the # symbol.',
      inputSchema: {
        type: 'object',
        properties: {
          hashtag: { type: 'string', description: 'Hashtag to search for (without # symbol, max 30 chars, case-insensitive)' },
          limit: { type: 'number', description: 'Number of items to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Compound cursor for older content' },
          after: { type: 'string', description: 'Compound cursor for newer content' },
        },
        required: ['hashtag'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-hashtag-content', {
          hashtag: args.hashtag,
          requesterPubkey: config.publicKey,
          limit: String(args.limit || 20),
          before: args.before,
          after: args.after,
        });
        if (data.posts) data.posts = decodePosts(data.posts);
        return JSON.stringify(data, null, 2);
      },
    },
    {
      name: 'k_get_trending_hashtags',
      description: 'Get trending hashtags on the K network within a time window.',
      inputSchema: {
        type: 'object',
        properties: {
          timeWindow: { type: 'string', description: "Time window: '1h', '6h', '24h', '7d', or '30d'", default: '24h' },
          limit: { type: 'number', description: 'Number of hashtags to return (1-100)', default: 10 },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-trending-hashtags', {
          timeWindow: args.timeWindow || '24h',
          limit: String(args.limit || 10),
        });
        return JSON.stringify(data, null, 2);
      },
    },
  ];
}
