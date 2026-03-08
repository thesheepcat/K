import { Base64 } from 'js-base64';
import type { ServerPost, ServerQuoteData, ServerNotification } from '../types/indexer.js';

/**
 * Fetch JSON from the K-indexer API.
 */
export async function fetchFromIndexer(
  apiBaseUrl: string,
  endpoint: string,
  params: Record<string, string | undefined>,
): Promise<any> {
  const url = new URL(endpoint, apiBaseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.append(key, value);
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`K-indexer HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Decode Base64-encoded text fields in a post object.
 * Profile images are kept as Base64 (binary data).
 */
export function decodePost(post: ServerPost): ServerPost {
  return {
    ...post,
    postContent: post.postContent ? Base64.decode(post.postContent) : '',
    userNickname: post.userNickname ? Base64.decode(post.userNickname) : undefined,
    quote: post.quote ? decodeQuote(post.quote) : undefined,
  };
}

function decodeQuote(quote: ServerQuoteData): ServerQuoteData {
  return {
    ...quote,
    referencedMessage: quote.referencedMessage
      ? Base64.decode(quote.referencedMessage)
      : '',
    referencedNickname: quote.referencedNickname
      ? Base64.decode(quote.referencedNickname)
      : undefined,
  };
}

/**
 * Decode Base64 fields in a notification object.
 */
export function decodeNotification(notif: ServerNotification): ServerNotification {
  return {
    ...notif,
    postContent: notif.postContent ? Base64.decode(notif.postContent) : '',
    userNickname: notif.userNickname ? Base64.decode(notif.userNickname) : undefined,
    votedContent: notif.votedContent ? Base64.decode(notif.votedContent) : null,
  };
}

/**
 * Decode an array of posts.
 */
export function decodePosts(posts: ServerPost[]): ServerPost[] {
  return posts.map(decodePost);
}
