import React, { useState } from 'react';
import { Server, Network, Globe, HardDrive, Palette } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectOption } from '@/components/ui/select';
import { useUserSettings, type KaspaNetwork, type KaspaConnectionType, type Theme } from '@/contexts/UserSettingsContext';
import { KASPA_NETWORKS } from '@/constants/networks';

const SettingsView: React.FC = () => {
  const {
    selectedNetwork,
    setSelectedNetwork,
    getNetworkDisplayName,
    apiBaseUrl,
    setApiBaseUrl,
    kaspaConnectionType,
    setKaspaConnectionType,
    customKaspaNodeUrl,
    setCustomKaspaNodeUrl,
    theme,
    setTheme
  } = useUserSettings();

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [localApiBaseUrl, setLocalApiBaseUrl] = useState<string>(apiBaseUrl);


  const handleApiUrlChange = (value: string) => {
    setLocalApiBaseUrl(value);
  };

  const handleApiUrlBlur = () => {
    if (localApiBaseUrl !== apiBaseUrl) {
      setApiBaseUrl(localApiBaseUrl);
      showSaveFeedback('Server URL updated');
    }
  };

  const handleConnectionTypeChange = (type: KaspaConnectionType) => {
    setKaspaConnectionType(type);
    if (type === 'resolver') {
      // Clear custom node URL when switching to resolver
      setCustomKaspaNodeUrl('');
    }
    showSaveFeedback('Kaspa connection type updated');
  };

  const handleCustomNodeUrlChange = (value: string) => {
    setCustomKaspaNodeUrl(value);
    showSaveFeedback('Custom node URL updated');
  };

  const handleNetworkChange = (network: KaspaNetwork) => {
    setSelectedNetwork(network);
    showSaveFeedback('Network updated');
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    showSaveFeedback('Theme updated');
  };

  const showSaveFeedback = (message: string) => {
    setSaveFeedback(message);
    setTimeout(() => setSaveFeedback(null), 2000);
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <h1 className="text-lg sm:text-xl font-bold">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Configure your application preferences</p>
      </div>

      <div className="flex-1 overflow-y-scroll p-3 sm:p-4" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Save Feedback */}
          {saveFeedback && (
            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-none">
              {saveFeedback}
            </div>
          )}

          {/* Current Settings Summary */}
          <Card className="border border-border rounded-none bg-muted">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-foreground">Current Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Server</label>
                    <div className="bg-background border border-border p-2 font-mono text-xs">
                      {apiBaseUrl}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Network</label>
                    <div className="bg-background border border-border p-2 text-xs">
                      {getNetworkDisplayName(selectedNetwork)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Connection</label>
                    <div className="bg-background border border-border p-2 text-xs">
                      {kaspaConnectionType === 'resolver' ? 'Resolver (Automatic)' : 'Custom Node'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Theme</label>
                    <div className="bg-background border border-border p-2 text-xs capitalize">
                      {theme}
                    </div>
                  </div>
                  
                  {kaspaConnectionType === 'custom-node' && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Node URL</label>
                      <div className="bg-background border border-border p-2 font-mono text-xs break-all">
                        {customKaspaNodeUrl || 'Not configured'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Server Settings */}
          <Card className="border border-border rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Server Configuration</h2>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Server URL
                  </label>
                  <Input
                    type="url"
                    value={localApiBaseUrl}
                    onChange={(e) => handleApiUrlChange(e.target.value)}
                    onBlur={handleApiUrlBlur}
                    placeholder={window.location.protocol === 'https:' ? '/api or https://your-backend.com' : 'http://localhost:3000'}
                    className="font-mono text-sm rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                  />
                  <p className="text-xs text-muted-foreground">
                    The base URL for the API server that handles posts and social features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaspa Network Settings */}
          <Card className="border border-border rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Network className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Kaspa Network</h2>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Network
                  </label>
                  <Select
                    value={selectedNetwork}
                    onChange={(e) => handleNetworkChange(e.target.value as KaspaNetwork)}
                    className="w-full"
                  >
                    {/*<SelectOption value={KASPA_NETWORKS.MAINNET}>Mainnet</SelectOption>*/}
                    <SelectOption value={KASPA_NETWORKS.TESTNET_10}>Testnet 10</SelectOption>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose which Kaspa network to use for transactions and wallet operations.
                    {selectedNetwork === KASPA_NETWORKS.MAINNET && ' ⚠️ Real KAS will be used!'}
                    {selectedNetwork !== KASPA_NETWORKS.MAINNET && ' Test network - no real KAS.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaspa Connection Settings */}
          <Card className="border border-border rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Kaspa Connection</h2>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Connection Type
                  </label>
                  <Select
                    value={kaspaConnectionType}
                    onChange={(e) => handleConnectionTypeChange(e.target.value as KaspaConnectionType)}
                    className="w-full"
                  >
                    <SelectOption value="resolver">Resolver (Automatic)</SelectOption>
                    <SelectOption value="custom-node">Your Kaspa Node</SelectOption>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {kaspaConnectionType === 'resolver' 
                      ? 'Automatically connect to available Kaspa nodes using the resolver service.'
                      : 'Connect directly to your own Kaspa node for maximum control and privacy.'
                    }
                  </p>
                </div>

                {/* Custom Node URL Input */}
                {kaspaConnectionType === 'custom-node' && (
                  <div className="space-y-2 mt-4 p-4 bg-muted border border-border rounded-none">
                    <label className="block text-sm font-medium text-foreground">
                      <HardDrive className="h-4 w-4 inline mr-2" />
                      Kaspa Node URL
                    </label>
                    <textarea
                      value={customKaspaNodeUrl}
                      onChange={(e) => handleCustomNodeUrlChange(e.target.value)}
                      placeholder="wss://your-kaspa-node.com:16210&#10;or&#10;192.168.1.100:16210"
                      className="w-full min-h-[80px] px-3 py-2 border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-vertical rounded-none"
                      style={{ fontFamily: 'monospace' }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the IP address and port of your Kaspa node. Include protocol (ws:// or wss://) if needed.
                      <br />
                      Examples: <code className="bg-muted px-1">192.168.1.100:16210</code> or <code className="bg-muted px-1">wss://node.kaspa.org:16210</code>
                    </p>
                    
                    {customKaspaNodeUrl.trim() === '' && (
                      <div className="bg-warning/10 border border-warning/20 p-3 rounded-none">
                        <p className="text-sm text-warning font-medium">⚠️ Custom node URL required</p>
                        <p className="text-xs text-warning/80 mt-1">
                          Please enter your Kaspa node URL to use custom node connection.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="border border-border rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Appearance</h2>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Theme
                  </label>
                  <Select
                    value={theme}
                    onChange={(e) => handleThemeChange(e.target.value as Theme)}
                    className="w-full"
                  >
                    <SelectOption value="light">Light</SelectOption>
                    <SelectOption value="dark">Dark</SelectOption>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose between light and dark theme for the interface.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground py-4">
            <p>Settings are automatically saved when changed.</p>
            <p className="mt-1">Some changes may require refreshing the page to take full effect.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;