import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { fetchHealthCheck } from '@/services/postsApi';
import { toast } from 'sonner';

/**
 * Hook to validate that the selected network matches the indexer server's network
 * Shows a persistent error toast if there's a mismatch
 */
export const useNetworkValidator = () => {
  const { isAuthenticated } = useAuth();
  const { selectedNetwork, apiBaseUrl, getNetworkDisplayName, isSettingsLoaded } = useUserSettings();

  useEffect(() => {
    // Only validate after successful login AND settings are loaded
    if (!isAuthenticated || !isSettingsLoaded) {
      return;
    }

    const validateNetwork = async () => {
      try {
        const healthData = await fetchHealthCheck(apiBaseUrl);

        // Check if the server's network matches the user's selected network
        if (healthData.network !== selectedNetwork) {
          // Show persistent error toast (duration: Infinity means it won't auto-dismiss)
          toast.error(
            `Network Mismatch Detected`,
            {
              description: `The indexer server is running on "${healthData.network}" but you selected "${getNetworkDisplayName(selectedNetwork)}". Please update your server URL in Settings to match your selected network.`,
              duration: Infinity,
              action: {
                label: 'Dismiss',
                onClick: () => {
                  // Toast will be dismissed when user clicks
                }
              }
            }
          );
        }
      } catch (error) {
        console.error('Failed to validate network:', error);
        // Show error toast for connection issues
        toast.error(
          'Unable to Connect to Indexer',
          {
            description: `Failed to connect to the indexer server at ${apiBaseUrl}. Please verify the server URL in Settings.`,
            duration: Infinity,
            action: {
              label: 'Dismiss',
              onClick: () => {
                // Toast will be dismissed when user clicks
              }
            }
          }
        );
      }
    };

    validateNetwork();
  }, [isAuthenticated, isSettingsLoaded, selectedNetwork, apiBaseUrl, getNetworkDisplayName]);
};
