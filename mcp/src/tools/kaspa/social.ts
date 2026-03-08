import { createPost, createReply, createVote, createQuote, createFollow, createBlock, broadcastProfile } from '../../services/transactionBuilder.js';
import type { ResolvedConfig } from '../../types/config.js';
import type { ToolDefinition } from '../types.js';

// AI agents sometimes pass arrays as JSON strings — normalize defensively
function parsePubkeys(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value ? [value] : []; }
  }
  return [];
}

export function socialTools(config: ResolvedConfig): ToolDefinition[] {
  return [
    {
      name: 'k_create_post',
      description: 'Create a new post on the K social network. The post content will be broadcast as a Kaspa transaction. Mention other users by including their public key prefixed with @.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Post content text (will be Base64-encoded)' },
          mentionedPubkeys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of public keys to mention in the post',
          },
        },
        required: ['content'],
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      handler: async (args: any) => {
        const result = await createPost(config, args.content, parsePubkeys(args.mentionedPubkeys));
        return JSON.stringify(result, null, 2);
      },
    },
    {
      name: 'k_create_reply',
      description: 'Reply to an existing post or reply on K. The reply will appear as a nested response to the target content.',
      inputSchema: {
        type: 'object',
        properties: {
          postId: { type: 'string', description: 'Transaction ID of the post/reply to respond to. Must be exactly 64 lowercase hex characters (e.g. "a1b2c3..."). Obtain it from the "id" field of a post returned by k_get_posts or k_get_post_details.' },
          content: { type: 'string', description: 'Reply content text' },
          mentionedPubkeys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of public keys to mention. Should include the author of the post being replied to.',
          },
        },
        required: ['postId', 'content'],
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      handler: async (args: any) => {
        if (!args.postId || typeof args.postId !== 'string' || !/^[0-9a-fA-F]{64}$/.test(args.postId)) {
          throw new Error(`Invalid postId: expected a 64-character hex transaction ID, got: ${JSON.stringify(args.postId)}`);
        }
        const result = await createReply(config, args.postId, args.content, parsePubkeys(args.mentionedPubkeys));
        return JSON.stringify(result, null, 2);
      },
    },
    {
      name: 'k_vote',
      description: 'Upvote or downvote a post or reply on K.',
      inputSchema: {
        type: 'object',
        properties: {
          postId: { type: 'string', description: 'ID of the post/reply to vote on (64-char hex)' },
          vote: { type: 'string', description: "Vote type: 'upvote' or 'downvote'" },
          authorPubkey: { type: 'string', description: 'Public key of the content author (for notification)' },
        },
        required: ['postId', 'vote', 'authorPubkey'],
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      handler: async (args: any) => {
        const result = await createVote(config, args.postId, args.vote, args.authorPubkey);
        return JSON.stringify(result, null, 2);
      },
    },
    {
      name: 'k_quote',
      description: 'Quote (repost with comment) an existing post or reply on K.',
      inputSchema: {
        type: 'object',
        properties: {
          contentId: { type: 'string', description: 'ID of the content to quote (64-char hex)' },
          content: { type: 'string', description: 'Your commentary on the quoted content' },
          authorPubkey: { type: 'string', description: 'Public key of the original content author' },
        },
        required: ['contentId', 'content', 'authorPubkey'],
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      handler: async (args: any) => {
        const result = await createQuote(config, args.contentId, args.content, args.authorPubkey);
        return JSON.stringify(result, null, 2);
      },
    },
    {
      name: 'k_follow',
      description: 'Follow or unfollow a user on the K network.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', description: "Action: 'follow' or 'unfollow'" },
          userPubkey: { type: 'string', description: 'Public key of the user to follow/unfollow' },
        },
        required: ['action', 'userPubkey'],
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      handler: async (args: any) => {
        const result = await createFollow(config, args.action, args.userPubkey);
        return JSON.stringify(result, null, 2);
      },
    },
    {
      name: 'k_block',
      description: "Block or unblock a user on the K network. Blocked users' content will be hidden from your feeds.",
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', description: "Action: 'block' or 'unblock'" },
          userPubkey: { type: 'string', description: 'Public key of the user to block/unblock' },
        },
        required: ['action', 'userPubkey'],
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      handler: async (args: any) => {
        const result = await createBlock(config, args.action, args.userPubkey);
        return JSON.stringify(result, null, 2);
      },
    },
    {
      name: 'k_broadcast_profile',
      description: 'Create or update your K profile by broadcasting your nickname, profile image, and introduction message to the network.',
      inputSchema: {
        type: 'object',
        properties: {
          nickname: { type: 'string', description: 'Your display name' },
          profileImage: { type: 'string', description: 'Base64-encoded profile image (should be a small image, e.g. 48x48 PNG/WebP)' },
          introMessage: { type: 'string', description: 'Short introduction message (under 100 characters recommended)' },
        },
        required: ['nickname', 'profileImage', 'introMessage'],
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      handler: async (args: any) => {
        const result = await broadcastProfile(config, args.nickname, args.profileImage, args.introMessage);
        return JSON.stringify(result, null, 2);
      },
    },
  ];
}
