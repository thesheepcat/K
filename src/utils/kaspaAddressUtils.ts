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

/**
 * Validate a Kaspa address format and optionally check network consistency
 */
export const validateKaspaAddress = async (
  address: string,
  expectedNetwork?: string
): Promise<boolean> => {
  try {
    await kaspaService.ensureLoaded();
    const kaspa = kaspaService.getKaspa();
    const { Address } = kaspa;

    const trimmedAddress = address.trim();

    // Use Address.validate if available
    if (Address.validate) {
      const isValid = Address.validate(trimmedAddress);
      if (!isValid) {
        console.error('Address validation failed: Invalid address format');
        return false;
      }
    }

    // Try to create Address object
    const addressObj = new Address(trimmedAddress);

    // If expectedNetwork is provided, check prefix consistency
    if (expectedNetwork) {
      const prefix = addressObj.prefix;

      // Mainnet addresses have prefix "kaspa"
      // Testnet addresses have prefix "kaspatest" or similar
      if (expectedNetwork.includes('mainnet') && prefix !== 'kaspa') {
        console.error(`Address validation failed: Expected mainnet address but got prefix "${prefix}"`);
        return false;
      }
      if (expectedNetwork.includes('testnet') && !prefix.includes('test')) {
        console.error(`Address validation failed: Expected testnet address but got prefix "${prefix}"`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Address validation error:', error);
    return false;
  }
};

/**
 * Derive public key from script public key
 */
const derivePublicKeyFromScriptPublicKey = (scriptPublicKey: any): string => {
  const scriptFromAddress = scriptPublicKey.script;
  const derivedPublicKey = scriptFromAddress.slice(2, -2);
  const formattedPublicKey = '02' + derivedPublicKey;
  return formattedPublicKey;
};

/**
 * Convert Kaspa address to public key
 */
export const addressToPublicKey = async (address: string): Promise<string | null> => {
  try {
    await kaspaService.ensureLoaded();
    const kaspa = kaspaService.getKaspa();
    const { Address, payToAddressScript } = kaspa;

    const trimmedAddress = address.trim();

    // Validate address first
    const isValid = await validateKaspaAddress(trimmedAddress);
    if (!isValid) {
      return null;
    }

    // Convert address to Address object
    const peerAddress = new Address(trimmedAddress);

    // Get script public key from address
    const scriptPublicKey = payToAddressScript(peerAddress);

    // Derive public key from script
    const publicKey = derivePublicKeyFromScriptPublicKey(scriptPublicKey);

    return publicKey;
  } catch (error) {
    console.error('Error converting address to public key:', error);
    return null;
  }
};