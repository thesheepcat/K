import kaspaService from '@/services/kaspaService';

export const validateKaspaPublicKey = async (pubkey: string): Promise<boolean> => {
  try {
    await kaspaService.ensureLoaded();
    const kaspa = kaspaService.getKaspa();
    const { PublicKey } = kaspa;
    
    const trimmedPubkey = pubkey.trim();
    
    // Check if it looks like a hex string (public keys are typically 66 chars: 02/03 prefix + 64 hex chars)
    if (!/^[0-9a-fA-F]{66}$/.test(trimmedPubkey)) {
      return false;
    }
    
    // Try to create PublicKey object
    new PublicKey(trimmedPubkey);
    
    return true;
  } catch (error) {
    console.error('Public key validation error:', error);
    return false;
  }
};

export const validateAndReturnPublicKey = async (pubkey: string): Promise<string | null> => {
  const isValid = await validateKaspaPublicKey(pubkey);
  return isValid ? pubkey.trim() : null;
};

export const detectMentionsInText = (text: string): Array<{
  pubkey: string;
  startIndex: number;
  endIndex: number;
}> => {
  const mentions: Array<{
    pubkey: string;
    startIndex: number;
    endIndex: number;
  }> = [];
  
  // Regex to match public keys after @ symbol
  // Public keys are 66 character hex strings (02/03 prefix + 64 hex chars)
  const mentionRegex = /@([0-9a-fA-F]{66})/g;
  
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      pubkey: match[1], // The pubkey without the @ symbol
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return mentions;
};

export const formatPublicKeyForDisplay = (pubkey: string, maxLength: number = 20): string => {
  if (pubkey.length <= maxLength) {
    return pubkey;
  }
  
  // For public keys, show first 4 chars + ... + last 4 chars
  const prefixLength = 4;
  const suffixLength = 4;
  return `${pubkey.substring(0, prefixLength)}...${pubkey.substring(pubkey.length - suffixLength)}`;
};