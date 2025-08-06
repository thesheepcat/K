import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import kaspaService from '@/services/kaspaService';

export const useKaspaAuth = () => {
  const auth = useAuth();
  const { selectedNetwork, getNetworkRPCId } = useUserSettings();

  const generateNetworkAwareKeyPair = async (privateKeyHex?: string) => {
    await kaspaService.ensureLoaded();
    return kaspaService.generateKeyPair(privateKeyHex, getNetworkRPCId(selectedNetwork));
  };

  const getNetworkAwareAddress = async () => {
    if (!auth.privateKey) return null;
    
    try {
      const keyPair = await generateNetworkAwareKeyPair(auth.privateKey);
      return keyPair.address;
    } catch (error) {
      console.error('Error generating network-aware address:', error);
      return auth.address; // Fallback to stored address
    }
  };

  return {
    ...auth,
    generateNetworkAwareKeyPair,
    getNetworkAwareAddress,
    selectedNetwork,
    networkId: getNetworkRPCId(selectedNetwork)
  };
};