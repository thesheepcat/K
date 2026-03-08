import { fetchFromIndexer, decodePosts } from '../../services/indexerClient.js';
import type { ResolvedConfig } from '../../types/config.js';
import type { ToolDefinition } from '../types.js';

export function userTools(config: ResolvedConfig): ToolDefinition[] {
  return [
    {
      name: 'k_get_users',
      description: 'Browse the K user directory. Returns user profiles (introduction posts) with pagination.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of users to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Cursor for older entries' },
          after: { type: 'string', description: 'Cursor for newer entries' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-users', {
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
      name: 'k_search_users',
      description: 'Search for K users by their public key (exact match) or nickname (partial, case-insensitive match).',
      inputSchema: {
        type: 'object',
        properties: {
          pubkey: { type: 'string', description: 'Exact public key to search for (66-char hex)' },
          nickname: { type: 'string', description: 'Partial nickname to search for (case-insensitive)' },
          limit: { type: 'number', description: 'Number of results (1-100)', default: 20 },
          before: { type: 'string', description: 'Cursor for pagination' },
          after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/search-users', {
          requesterPubkey: config.publicKey,
          searchedUserPubkey: args.pubkey,
          searchedUserNickname: args.nickname,
          limit: String(args.limit || 20),
          before: args.before,
          after: args.after,
        });
        if (data.posts) data.posts = decodePosts(data.posts);
        return JSON.stringify(data, null, 2);
      },
    },
    {
      name: 'k_get_user_details',
      description: 'Get detailed profile information for a specific user, including follower/following counts and relationship status.',
      inputSchema: {
        type: 'object',
        properties: {
          user: { type: 'string', description: 'Public key of the user (66-char hex)' },
        },
        required: ['user'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-user-details', {
          user: args.user,
          requesterPubkey: config.publicKey,
        });
        // Decode nickname/content fields if present
        if (data.post) {
          const { Base64 } = await import('js-base64');
          if (data.post.postContent) data.post.postContent = Base64.decode(data.post.postContent);
          if (data.post.userNickname) data.post.userNickname = Base64.decode(data.post.userNickname);
        }
        return JSON.stringify(data, null, 2);
      },
    },
    {
      name: 'k_get_followed_users',
      description: 'Get the list of users you are currently following.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of users to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Cursor for older entries' },
          after: { type: 'string', description: 'Cursor for newer entries' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-followed-users', {
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
      name: 'k_get_users_following',
      description: 'Get the list of users that a specific user follows.',
      inputSchema: {
        type: 'object',
        properties: {
          userPubkey: { type: 'string', description: 'Public key of the user to query' },
          limit: { type: 'number', description: 'Number of users to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Cursor for pagination' },
          after: { type: 'string', description: 'Cursor for pagination' },
        },
        required: ['userPubkey'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-users-following', {
          requesterPubkey: config.publicKey,
          userPubkey: args.userPubkey,
          limit: String(args.limit || 20),
          before: args.before,
          after: args.after,
        });
        if (data.posts) data.posts = decodePosts(data.posts);
        return JSON.stringify(data, null, 2);
      },
    },
    {
      name: 'k_get_users_followers',
      description: 'Get the list of users that follow a specific user.',
      inputSchema: {
        type: 'object',
        properties: {
          userPubkey: { type: 'string', description: 'Public key of the user to query' },
          limit: { type: 'number', description: 'Number of users to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Cursor for pagination' },
          after: { type: 'string', description: 'Cursor for pagination' },
        },
        required: ['userPubkey'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-users-followers', {
          requesterPubkey: config.publicKey,
          userPubkey: args.userPubkey,
          limit: String(args.limit || 20),
          before: args.before,
          after: args.after,
        });
        if (data.posts) data.posts = decodePosts(data.posts);
        return JSON.stringify(data, null, 2);
      },
    },
    {
      name: 'k_get_blocked_users',
      description: 'Get the list of users you have blocked.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of users to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Cursor for pagination' },
          after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-blocked-users', {
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
      name: 'k_get_most_active_users',
      description: 'Get the most active users on the K network within a time window, ranked by total content count.',
      inputSchema: {
        type: 'object',
        properties: {
          timeWindow: { type: 'string', description: "Time window: '1h', '6h', '24h', '7d', or '30d'", default: '24h' },
          limit: { type: 'number', description: 'Number of users to return (1-100)', default: 10 },
          before: { type: 'string', description: 'Compound cursor for pagination' },
          after: { type: 'string', description: 'Compound cursor for pagination' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-most-active-users', {
          requesterPubkey: config.publicKey,
          timeWindow: args.timeWindow || '24h',
          limit: String(args.limit || 10),
          before: args.before,
          after: args.after,
        });
        if (data.posts) data.posts = decodePosts(data.posts);
        return JSON.stringify(data, null, 2);
      },
    },
  ];
}
