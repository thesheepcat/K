import { useUserSettings } from '@/contexts/UserSettingsContext';
import { generateAuthorInfo, createReplyPost, pubkeyToKaspaAddress } from '@/utils/postUtils';

export const useKaspaPostUtils = () => {
  const { selectedNetwork, getNetworkRPCId } = useUserSettings();

  const networkAwareGenerateAuthorInfo = async (authorPubkey: string, currentUserPubkey?: string) => {
    return generateAuthorInfo(authorPubkey, currentUserPubkey, getNetworkRPCId(selectedNetwork));
  };

  const networkAwareCreateReplyPost = async (content: string, userPubkey: string) => {
    return createReplyPost(content, userPubkey, getNetworkRPCId(selectedNetwork));
  };

  const networkAwarePubkeyToKaspaAddress = async (pubkey: string) => {
    return pubkeyToKaspaAddress(pubkey, getNetworkRPCId(selectedNetwork));
  };

  return {
    generateAuthorInfo: networkAwareGenerateAuthorInfo,
    createReplyPost: networkAwareCreateReplyPost,
    pubkeyToKaspaAddress: networkAwarePubkeyToKaspaAddress,
    selectedNetwork,
    networkId: getNetworkRPCId(selectedNetwork)
  };
};