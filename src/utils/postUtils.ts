import { type Post } from '@/models/types';
import kaspaService from '@/services/kaspaService';
import { KASPA_NETWORKS } from '@/constants/networks';

/**
 * Recursively search for a post or reply by ID across all posts and their nested replies
 */
export const findPostById = (posts: Post[], targetId: string): Post | null => {
  for (const post of posts) {
    // Check if this is the post we're looking for
    if (post.id === targetId) {
      return post;
    }
    
    // Search in replies if they exist
    if (post.nestedReplies && post.nestedReplies.length > 0) {
      const foundInReplies = findPostById(post.nestedReplies, targetId);
      if (foundInReplies) {
        return foundInReplies;
      }
    }
  }
  
  return null;
};

/**
 * Get all replies for a specific post/reply ID
 */
export const getRepliesForPost = (posts: Post[], postId: string): Post[] => {
  const targetPost = findPostById(posts, postId);
  return targetPost?.nestedReplies || [];
};

// Legacy function name for backward compatibility
/**
 * Get all comments for a specific post/comment ID
 * @deprecated Use getRepliesForPost instead
 */
export const getCommentsForPost = (posts: Post[], postId: string): Post[] => {
  return getRepliesForPost(posts, postId);
};

export const createReplyPost = async (content: string, userPubkey: string, networkId?: string): Promise<Post> => {
  const now = new Date();
  const timeString = now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', ' ·');

  // Generate author info with proper formatting
  const authorInfo = await generateAuthorInfo(userPubkey, userPubkey, networkId); // currentUser is the same as author for own posts

  return {
    id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    author: authorInfo,
    timestamp: timeString,
    upVotes: 0,
    downVotes: 0,
    reposts: 0,
    replies: 0,
    quotes: 0,
    upVoted: false,
    downVoted: false,
    reposted: false,
    nestedReplies: []
  };
};

/**
 * Extract mentioned pubkeys from a post and its reply chain
 * For a reply, this includes the original post author and all previous reply authors
 */
export const extractMentionedPubkeys = (posts: Post[], targetPostId: string, currentUserPubkey?: string): string[] => {
  const mentionedPubkeys: Set<string> = new Set();
  
  // Find the target post/reply
  const targetPost = findPostById(posts, targetPostId);
  if (!targetPost) {
    return [];
  }
  
  // For replies, we need to traverse up the chain to find all mentioned users
  const findMentionedInChain = (post: Post, allPosts: Post[]) => {
    // Add the author's pubkey if available, otherwise use username as fallback
    const authorPubkey = post.author.pubkey || post.author.username;
    mentionedPubkeys.add(authorPubkey);
    
    // Find the parent post this is replying to
    // This is a simplified approach - in practice you'd track parent relationships
    for (const parentPost of allPosts) {
      if (parentPost.nestedReplies?.some(reply => reply.id === post.id)) {
        // Found the parent, add its author and check its chain
        const parentAuthorPubkey = parentPost.author.pubkey || parentPost.author.username;
        mentionedPubkeys.add(parentAuthorPubkey);
        findMentionedInChain(parentPost, allPosts);
        break;
      }
      
      // Also check nested replies for parent relationships
      if (parentPost.nestedReplies) {
        for (const nestedReply of parentPost.nestedReplies) {
          if (nestedReply.nestedReplies?.some(deepReply => deepReply.id === post.id)) {
            const nestedAuthorPubkey = nestedReply.author.pubkey || nestedReply.author.username;
            mentionedPubkeys.add(nestedAuthorPubkey);
            findMentionedInChain(nestedReply, allPosts);
            return;
          }
        }
      }
    }
  };
  
  // Start the chain traversal
  findMentionedInChain(targetPost, posts);
  
  // Remove the current user from mentions (they shouldn't mention themselves)
  if (currentUserPubkey) {
    mentionedPubkeys.delete(currentUserPubkey);
  }
  // Also remove common placeholder usernames
  mentionedPubkeys.delete('you');
  
  return Array.from(mentionedPubkeys);
};

/**
 * Convert username to pubkey (placeholder function)
 * In a real implementation, this would look up the actual pubkey for a username
 */
export const getUserPubkeyFromUsername = (username: string): string => {
  // This is a placeholder - in reality you'd have a mapping service or API call
  // For now, we'll just return the username as a placeholder
  return username;
};

/**
 * Convert a pubkey to a Kaspa address
 */
export const pubkeyToKaspaAddress = async (pubkey: string, networkId?: string): Promise<string> => {
  try {
    await kaspaService.ensureLoaded();
    const kaspa = kaspaService.getKaspa();

    // Create public key object from the pubkey string
    const publicKeyObj = new kaspa.PublicKey(pubkey);

    // Get address - use provided networkId or default to mainnet
    const targetNetwork = networkId || KASPA_NETWORKS.MAINNET;
    const addressObj = publicKeyObj.toAddress(targetNetwork);
    return addressObj.toString();
  } catch (error) {
    console.error('Error converting pubkey to address:', error);
    // Fallback to showing the pubkey itself
    return pubkey;
  }
};

/**
 * Format author display name based on whether the user is the author
 * IMPORTANT: This only changes the display name, not the pubkey used for reply chains
 */
export const formatAuthorDisplayName = (authorPubkey: string, currentUserPubkey?: string): string => {
  if (currentUserPubkey && authorPubkey === currentUserPubkey) {
    return "You";
  }
  
  // Format as first 4 chars + "..." + last 4 chars
  if (authorPubkey.length >= 8) {
    return `${authorPubkey.substring(0, 4)}...${authorPubkey.substring(authorPubkey.length - 4)}`;
  }
  
  // If pubkey is shorter than 8 chars, just return it as is
  return authorPubkey;
};

/**
 * Truncate Kaspa address for display to save space
 * Format: kaspa:qz0s...t8cv (shows first 4 chars after prefix + last 4 chars)
 */
export const truncateKaspaAddress = (address: string, prefixLength: number = 8, suffixLength: number = 8): string => {
  if (!address || address.length <= 15) {
    return address; // Too short to truncate meaningfully
  }
  
  // Handle kaspa: prefix
  const kaspaPrefix = "kaspa:";
  if (address.startsWith(kaspaPrefix)) {
    const addressPart = address.substring(kaspaPrefix.length);
    if (addressPart.length <= prefixLength + suffixLength) {
      return address; // Address part too short to truncate
    }
    
    const prefix = addressPart.substring(0, prefixLength);
    const suffix = addressPart.substring(addressPart.length - suffixLength);
    return `${kaspaPrefix}${prefix}...${suffix}`;
  }
  
  // For non-kaspa addresses, just do standard truncation
  const prefix = address.substring(0, prefixLength);
  const suffix = address.substring(address.length - suffixLength);
  return `${prefix}...${suffix}`;
};

/**
 * Generate author info for posts and comments with proper display formatting
 * IMPORTANT: Always preserves the original pubkey for reply chain functionality
 */
export const generateAuthorInfo = async (
  authorPubkey: string, 
  currentUserPubkey?: string, 
  networkId?: string,
  nickname?: string,
  profileImage?: string
) => {
  // Determine display name: nickname if available, "You" for current user, or truncated pubkey
  let displayName: string;
  if (nickname && nickname.trim()) {
    displayName = nickname;
  } else {
    displayName = formatAuthorDisplayName(authorPubkey, currentUserPubkey);
  }
  
  const kaspaAddress = await pubkeyToKaspaAddress(authorPubkey, networkId);
  
  // Avatar priority: profile image if available, otherwise empty (will use generated avatar)
  let avatarSource = '';
  if (profileImage && profileImage.trim()) {
    // Convert base64 to data URL for display
    avatarSource = `data:image/png;base64,${profileImage}`;
  }
  
  return {
    name: displayName,
    username: kaspaAddress, // This will be the full Kaspa address
    avatar: avatarSource,
    pubkey: authorPubkey, // CRITICAL: Always preserve the original pubkey for reply chains
    nickname: nickname,
    profileImage: profileImage
  } as {
    name: string;
    username: string;
    avatar: string;
    pubkey: string;
    nickname?: string;
    profileImage?: string;
  };
};