import { fetchFromIndexer, decodePosts, decodePost } from '../../services/indexerClient.js';
import type { ResolvedConfig } from '../../types/config.js';
import type { ToolDefinition } from '../types.js';

export function postTools(config: ResolvedConfig): ToolDefinition[] {
  return [
    {
      name: 'k_get_posts_watching',
      description: 'Get the latest posts from users you follow and your own posts (main feed). Use pagination cursors to load older or newer content.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of posts to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Unix timestamp cursor — return posts older than this' },
          after: { type: 'string', description: 'Unix timestamp cursor — return posts newer than this' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-posts-watching', {
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
      name: 'k_get_contents_following',
      description: 'Get all content types (posts, replies, quotes) from users you follow. Returns a mixed feed sorted by timestamp.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of items to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Compound cursor (timestamp_id) for older content' },
          after: { type: 'string', description: 'Compound cursor (timestamp_id) for newer content' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-contents-following', {
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
      name: 'k_get_posts',
      description: 'Get all posts from a specific user. If no user is specified, returns your own posts.',
      inputSchema: {
        type: 'object',
        properties: {
          user: { type: 'string', description: 'Public key of the user whose posts to retrieve' },
          limit: { type: 'number', description: 'Number of posts to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Cursor for older posts' },
          after: { type: 'string', description: 'Cursor for newer posts' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-posts', {
          user: args.user || config.publicKey,
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
      name: 'k_get_replies',
      description: 'Get replies to a specific post (by post ID) or all replies by a specific user (by pubkey). Exactly one of "post" or "user" must be provided.',
      inputSchema: {
        type: 'object',
        properties: {
          post: { type: 'string', description: 'Post ID (64-char hex) to get replies for' },
          user: { type: 'string', description: 'Public key of the user whose replies to retrieve' },
          limit: { type: 'number', description: 'Number of replies to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Cursor for older replies' },
          after: { type: 'string', description: 'Cursor for newer replies' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-replies', {
          post: args.post,
          user: args.user,
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
      name: 'k_get_post_details',
      description: 'Get complete details for a single post or reply, including vote counts, reply counts, and your voting status.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Post/reply ID (64-character hex hash)' },
        },
        required: ['id'],
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-post-details', {
          id: args.id,
          requesterPubkey: config.publicKey,
        });
        if (data.post) data.post = decodePost(data.post);
        return JSON.stringify(data, null, 2);
      },
    },
    {
      name: 'k_get_mentions',
      description: 'Get posts and replies where a specific user is mentioned. Defaults to your own mentions if no user specified.',
      inputSchema: {
        type: 'object',
        properties: {
          user: { type: 'string', description: 'Public key of the user whose mentions to retrieve (defaults to own pubkey)' },
          limit: { type: 'number', description: 'Number of items to return (1-100)', default: 20 },
          before: { type: 'string', description: 'Cursor for older content' },
          after: { type: 'string', description: 'Cursor for newer content' },
        },
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      handler: async (args: any) => {
        const data = await fetchFromIndexer(config.apiBaseUrl, '/get-mentions', {
          user: args.user || config.publicKey,
          requesterPubkey: config.publicKey,
          limit: String(args.limit || 20),
          before: args.before,
          after: args.after,
        });
        if (data.posts) data.posts = decodePosts(data.posts);
        return JSON.stringify(data, null, 2);
      },
    },
  ];
}
