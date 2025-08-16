import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type KaspaNetwork = 'mainnet' | 'testnet-10' | 'testnet-11';
export type KaspaConnectionType = 'resolver' | 'custom-node';
export type Theme = 'light' | 'dark';

interface UserSettingsContextType {
  selectedNetwork: KaspaNetwork;
  setSelectedNetwork: (network: KaspaNetwork) => void;
  getNetworkDisplayName: (network: KaspaNetwork) => string;
  getNetworkRPCId: (network: KaspaNetwork) => string;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  kaspaConnectionType: KaspaConnectionType;
  setKaspaConnectionType: (type: KaspaConnectionType) => void;
  customKaspaNodeUrl: string;
  setCustomKaspaNodeUrl: (url: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
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
  const [selectedNetwork, setSelectedNetworkState] = useState<KaspaNetwork>('testnet-10');
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(
      // Use relative path in production, localhost in development
      typeof window !== 'undefined' && window.location.protocol === 'https:' 
        ? 'https://indexer.kaspatalk.net' 
        : 'http://localhost:3000'
    );
  const [kaspaConnectionType, setKaspaConnectionTypeState] = useState<KaspaConnectionType>('resolver');
  const [customKaspaNodeUrl, setCustomKaspaNodeUrlState] = useState<string>('');
  const [theme, setThemeState] = useState<Theme>('light');

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        
        if (settings.selectedNetwork && 
            ['mainnet', 'testnet-10', 'testnet-11'].includes(settings.selectedNetwork)) {
          setSelectedNetworkState(settings.selectedNetwork);
        }
        
        if (settings.apiBaseUrl && typeof settings.apiBaseUrl === 'string') {
          setApiBaseUrlState(settings.apiBaseUrl);
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
      apiBaseUrl, 
      kaspaConnectionType, 
      customKaspaNodeUrl,
      theme
    };
    
    // Don't save on initial load (when all values are defaults)
    const isInitialLoad = selectedNetwork === 'testnet-10' && 
                         apiBaseUrl === 'http://localhost:3000' && 
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
  }, [selectedNetwork, apiBaseUrl, kaspaConnectionType, customKaspaNodeUrl, theme]);

  const saveSettings = (overrides: Partial<{
    selectedNetwork: KaspaNetwork;
    apiBaseUrl: string;
    kaspaConnectionType: KaspaConnectionType;
    customKaspaNodeUrl: string;
    theme: Theme;
  }> = {}) => {
    try {
      const settings = { 
        selectedNetwork: overrides.selectedNetwork ?? selectedNetwork, 
        apiBaseUrl: overrides.apiBaseUrl ?? apiBaseUrl, 
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

  const setApiBaseUrl = (url: string) => {
    setApiBaseUrlState(url);
    saveSettings({ apiBaseUrl: url });
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
    switch (network) {
      case 'mainnet':
        return 'Mainnet';
      case 'testnet-10':
        return 'Testnet 10';
      case 'testnet-11':
        return 'Testnet 11';
      default:
        return network;
    }
  };

  const getNetworkRPCId = (network: KaspaNetwork): string => {
    // Return the exact string needed for RPC connections
    return network;
  };

  const value: UserSettingsContextType = {
    selectedNetwork,
    setSelectedNetwork,
    getNetworkDisplayName,
    getNetworkRPCId,
    apiBaseUrl,
    setApiBaseUrl,
    kaspaConnectionType,
    setKaspaConnectionType,
    customKaspaNodeUrl,
    setCustomKaspaNodeUrl,
    theme,
    setTheme
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};