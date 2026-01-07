import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  type KaspaNetwork,
  DEFAULT_NETWORK,
  getNetworkDisplayName as getNetworkDisplayNameUtil,
  getNetworkRPCId as getNetworkRPCIdUtil,
  isValidNetwork
} from '@/constants/networks';

export type { KaspaNetwork } from '@/constants/networks';
export type KaspaConnectionType = 'resolver' | 'custom-node';
export type IndexerType = 'public' | 'local' | 'custom';
export type Theme = 'light' | 'dark';

interface UserSettingsContextType {
  selectedNetwork: KaspaNetwork;
  setSelectedNetwork: (network: KaspaNetwork) => void;
  getNetworkDisplayName: (network: KaspaNetwork) => string;
  getNetworkRPCId: (network: KaspaNetwork) => string;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  indexerType: IndexerType;
  setIndexerType: (type: IndexerType) => void;
  customIndexerUrl: string;
  setCustomIndexerUrl: (url: string) => void;
  kaspaConnectionType: KaspaConnectionType;
  setKaspaConnectionType: (type: KaspaConnectionType) => void;
  customKaspaNodeUrl: string;
  setCustomKaspaNodeUrl: (url: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isSettingsLoaded: boolean;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};

interface UserSettingsProviderProps {
  children: ReactNode;
}

const SETTINGS_STORAGE_KEY = 'kaspa_user_settings';

export const UserSettingsProvider: React.FC<UserSettingsProviderProps> = ({ children }) => {
  const [selectedNetwork, setSelectedNetworkState] = useState<KaspaNetwork>(DEFAULT_NETWORK);
  const [indexerType, setIndexerTypeState] = useState<IndexerType>('public');
  const [customIndexerUrl, setCustomIndexerUrlState] = useState<string>('');
  const [kaspaConnectionType, setKaspaConnectionTypeState] = useState<KaspaConnectionType>('resolver');
  const [customKaspaNodeUrl, setCustomKaspaNodeUrlState] = useState<string>('');
  const [theme, setThemeState] = useState<Theme>('light');
  const [isSettingsLoaded, setIsSettingsLoaded] = useState<boolean>(false);

  // Derive apiBaseUrl from indexerType and customIndexerUrl
  const apiBaseUrl = indexerType === 'public'
    ? 'https://mainnet.kaspatalk.net'
    : indexerType === 'local'
    ? '/api'
    : customIndexerUrl;

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);

        if (settings.selectedNetwork && isValidNetwork(settings.selectedNetwork)) {
          setSelectedNetworkState(settings.selectedNetwork);
        }

        // Migration logic: convert old apiBaseUrl to new indexerType system
        if (settings.indexerType && ['public', 'local', 'custom'].includes(settings.indexerType)) {
          // Migrate 'kaspatalk' to 'public' if found
          const migratedType = settings.indexerType === 'kaspatalk' ? 'public' : settings.indexerType;
          setIndexerTypeState(migratedType);
          if (settings.customIndexerUrl && typeof settings.customIndexerUrl === 'string') {
            setCustomIndexerUrlState(settings.customIndexerUrl);
          }
        } else if (settings.apiBaseUrl && typeof settings.apiBaseUrl === 'string') {
          // Migrate old apiBaseUrl to new system
          const url = settings.apiBaseUrl;
          if (url === 'https://mainnet.kaspatalk.net') {
            setIndexerTypeState('public');
          } else if (url === '/api') {
            setIndexerTypeState('local');
          } else {
            setIndexerTypeState('custom');
            setCustomIndexerUrlState(url);
          }
        }

        if (settings.kaspaConnectionType &&
            ['resolver', 'custom-node'].includes(settings.kaspaConnectionType)) {
          setKaspaConnectionTypeState(settings.kaspaConnectionType);
        }

        if (settings.customKaspaNodeUrl && typeof settings.customKaspaNodeUrl === 'string') {
          setCustomKaspaNodeUrlState(settings.customKaspaNodeUrl);
        }

        if (settings.theme && ['light', 'dark'].includes(settings.theme)) {
          setThemeState(settings.theme);
          // Apply theme to document root immediately
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', settings.theme);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      // Continue with default settings if loading fails
    } finally {
      // Mark settings as loaded
      setIsSettingsLoaded(true);
    }

    // Apply default theme if no settings exist
    if (typeof document !== 'undefined' && !localStorage.getItem(SETTINGS_STORAGE_KEY)) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // Save settings whenever they change (backup mechanism)
  useEffect(() => {
    const settings = {
      selectedNetwork,
      indexerType,
      customIndexerUrl,
      kaspaConnectionType,
      customKaspaNodeUrl,
      theme
    };

    // Don't save on initial load (when all values are defaults)
    const isInitialLoad = selectedNetwork === DEFAULT_NETWORK &&
                         indexerType === 'public' &&
                         customIndexerUrl === '' &&
                         kaspaConnectionType === 'resolver' &&
                         customKaspaNodeUrl === '' &&
                         theme === 'light';

    if (!isInitialLoad) {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Error auto-saving settings:', error);
      }
    }
  }, [selectedNetwork, indexerType, customIndexerUrl, kaspaConnectionType, customKaspaNodeUrl, theme]);

  const saveSettings = (overrides: Partial<{
    selectedNetwork: KaspaNetwork;
    indexerType: IndexerType;
    customIndexerUrl: string;
    kaspaConnectionType: KaspaConnectionType;
    customKaspaNodeUrl: string;
    theme: Theme;
  }> = {}) => {
    try {
      const settings = {
        selectedNetwork: overrides.selectedNetwork ?? selectedNetwork,
        indexerType: overrides.indexerType ?? indexerType,
        customIndexerUrl: overrides.customIndexerUrl ?? customIndexerUrl,
        kaspaConnectionType: overrides.kaspaConnectionType ?? kaspaConnectionType,
        customKaspaNodeUrl: overrides.customKaspaNodeUrl ?? customKaspaNodeUrl,
        theme: overrides.theme ?? theme
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  };

  const setSelectedNetwork = (network: KaspaNetwork) => {
    setSelectedNetworkState(network);
    saveSettings({ selectedNetwork: network });
  };

  // Deprecated: kept for backward compatibility, but now a no-op
  // Use setIndexerType and setCustomIndexerUrl instead
  const setApiBaseUrl = (_url: string) => {
    console.warn('setApiBaseUrl is deprecated. Use setIndexerType and setCustomIndexerUrl instead.');
  };

  const setIndexerType = (type: IndexerType) => {
    setIndexerTypeState(type);
    saveSettings({ indexerType: type });
  };

  const setCustomIndexerUrl = (url: string) => {
    setCustomIndexerUrlState(url);
    saveSettings({ customIndexerUrl: url });
  };

  const setKaspaConnectionType = (type: KaspaConnectionType) => {
    setKaspaConnectionTypeState(type);
    saveSettings({ kaspaConnectionType: type });
  };

  const setCustomKaspaNodeUrl = (url: string) => {
    setCustomKaspaNodeUrlState(url);
    saveSettings({ customKaspaNodeUrl: url });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveSettings({ theme: newTheme });

    // Apply theme to document root
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const getNetworkDisplayName = (network: KaspaNetwork): string => {
    return getNetworkDisplayNameUtil(network);
  };

  const getNetworkRPCId = (network: KaspaNetwork): string => {
    return getNetworkRPCIdUtil(network);
  };

  const value: UserSettingsContextType = {
    selectedNetwork,
    setSelectedNetwork,
    getNetworkDisplayName,
    getNetworkRPCId,
    apiBaseUrl,
    setApiBaseUrl,
    indexerType,
    setIndexerType,
    customIndexerUrl,
    setCustomIndexerUrl,
    kaspaConnectionType,
    setKaspaConnectionType,
    customKaspaNodeUrl,
    setCustomKaspaNodeUrl,
    theme,
    setTheme,
    isSettingsLoaded
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};