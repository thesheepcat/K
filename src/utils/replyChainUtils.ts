import { type Post } from '@/models/types';

/**
 * Build the mentioned_pubkeys array for a reply transaction
 * 
 * Simplified logic: when replying to a post/reply, include:
 * 1. The author of the post/reply being directly replied to
 * 2. All users mentioned in the parent's mentioned_pubkeys (to maintain the chain)
 * 
 * This ensures the full conversation chain is maintained.
 */
export const buildMentionedPubkeysForReply = (
  targetPost: Post, 
  currentUserPubkey?: string
): string[] => {
  // Suppress unused variable warning - parameter kept for future use
  void currentUserPubkey;
  const mentionedPubkeys: Set<string> = new Set();
  
  // 1. Add the author of the post being replied to
  if (targetPost.author.pubkey) {
    mentionedPubkeys.add(targetPost.author.pubkey);
  }
  
  // 2. If the target post/reply has mentioned_pubkeys (it's part of a reply chain),
  //    include those to maintain the full conversation chain
  if (targetPost.mentionedPubkeys && targetPost.mentionedPubkeys.length > 0) {
    targetPost.mentionedPubkeys.forEach(pubkey => {
      if (pubkey && pubkey.trim()) {
        mentionedPubkeys.add(pubkey);
      }
    });
  }
  
  // 3. Remove any placeholder usernames that might have been used
  mentionedPubkeys.delete('you');
  mentionedPubkeys.delete('');
  
  const result = Array.from(mentionedPubkeys);
  
  return result;
};

/**
 * Parse a transaction payload to extract mentioned_pubkeys
 * 
 * Expected format for replies:
 * k:1:reply:sender_pubkey:sender_signature:post_id:base64_encoded_message:mentioned_pubkeys
 * 
 * This is useful for parsing transaction data from the blockchain
 */
export const parseMentionedPubkeysFromPayload = (payload: string): string[] => {
  try {
    const parts = payload.split(':');
    
    // Check if it's a valid k protocol payload
    if (parts.length < 2 || parts[0] !== 'k' || parts[1] !== '1') {
      return [];
    }
    
    const action = parts[2];
    
    if (action === 'post') {
      // Format: k:1:post:sender_pubkey:sender_signature:base64_encoded_message:mentioned_pubkeys
      if (parts.length >= 7) {
        const mentionedPubkeysStr = parts[6];
        return JSON.parse(mentionedPubkeysStr);
      }
    } else if (action === 'reply') {
      // Format: k:1:reply:sender_pubkey:sender_signature:post_id:base64_encoded_message:mentioned_pubkeys
      if (parts.length >= 8) {
        const mentionedPubkeysStr = parts[7];
        return JSON.parse(mentionedPubkeysStr);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing mentioned_pubkeys from payload:', error);
    return [];
  }
};

/**
 * Validate a mentioned_pubkeys array
 * 
 * Ensures all entries are valid public keys (64-character hex strings)
 */
export const validateMentionedPubkeys = (mentionedPubkeys: string[]): boolean => {
  if (!Array.isArray(mentionedPubkeys)) {
    return false;
  }
  
  return mentionedPubkeys.every(pubkey => {
    // Check if it's a valid hex string of the expected length
    return typeof pubkey === 'string' && 
           pubkey.length === 64 && 
           /^[0-9a-fA-F]+$/.test(pubkey);
  });
};

/**
 * Create a debug string showing the reply chain
 * 
 * Useful for debugging reply chain issues
 */
export const debugReplyChain = (
  targetPost: Post, 
  mentionedPubkeys: string[], 
  currentUserPubkey?: string
): string => {
  const lines = [
    `Reply Chain Debug:`,
    `Target Post ID: ${targetPost.id}`,
    `Target Author: ${targetPost.author.username} (${targetPost.author.pubkey})`,
    `Target Mentioned Pubkeys: ${JSON.stringify(targetPost.mentionedPubkeys || [])}`,
    `Current User Pubkey: ${currentUserPubkey || 'N/A'}`,
    `Final Mentioned Pubkeys: ${JSON.stringify(mentionedPubkeys)}`,
    `Chain Length: ${mentionedPubkeys.length + 1} users` // +1 for current user
  ];
  
  return lines.join('\n');
};