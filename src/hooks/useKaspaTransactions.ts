import { useUserSettings } from '@/contexts/UserSettingsContext';
import { sendTransaction, type TransactionOptions } from '@/utils/sendTransaction';

export const useKaspaTransactions = () => {
  const { selectedNetwork, getNetworkRPCId } = useUserSettings();

  const sendNetworkAwareTransaction = async (options: Omit<TransactionOptions, 'networkId'>) => {
    return sendTransaction({
      ...options,
      networkId: getNetworkRPCId(selectedNetwork)
    });
  };

  return {
    sendTransaction: sendNetworkAwareTransaction,
    selectedNetwork,
    networkId: getNetworkRPCId(selectedNetwork)
  };
};