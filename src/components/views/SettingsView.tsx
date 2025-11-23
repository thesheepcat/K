import React, { useState } from 'react';
import { Server, Network, Globe, Palette, Info } from 'lucide-react';
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

  const [localApiBaseUrl, setLocalApiBaseUrl] = useState<string>(apiBaseUrl);


  const handleApiUrlChange = (value: string) => {
    setLocalApiBaseUrl(value);
  };

  const handleApiUrlBlur = () => {
    if (localApiBaseUrl !== apiBaseUrl) {
      setApiBaseUrl(localApiBaseUrl);
    }
  };

  const handleConnectionTypeChange = (type: KaspaConnectionType) => {
    setKaspaConnectionType(type);
    if (type === 'resolver') {
      // Clear custom node URL when switching to resolver
      setCustomKaspaNodeUrl('');
    }
  };

  const handleCustomNodeUrlChange = (value: string) => {
    setCustomKaspaNodeUrl(value);
  };

  const handleNetworkChange = (network: KaspaNetwork) => {
    setSelectedNetwork(network);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <h1 className="text-lg sm:text-xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-scroll p-3 sm:p-4" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Current Settings Summary */}
          <Card className="border border-border rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Current Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Network</label>
                    <div className="bg-muted border border-border p-2 text-sm">
                      {getNetworkDisplayName(selectedNetwork)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Indexer</label>
                    <div className="bg-muted border border-border p-2 text-sm">
                      {apiBaseUrl}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Connection</label>
                    <div className="bg-muted border border-border p-2 text-sm">
                      {kaspaConnectionType === 'resolver' ? 'Automatic (resolver)' : 'Custom Node'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Theme</label>
                    <div className="bg-muted border border-border p-2 text-sm capitalize">
                      {theme}
                    </div>
                  </div>

                  {kaspaConnectionType === 'custom-node' && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Node URL</label>
                      <div className="bg-muted border border-border p-2 text-sm break-all">
                        {customKaspaNodeUrl || 'Not configured'}
                      </div>
                    </div>
                  )}
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
                    {selectedNetwork === KASPA_NETWORKS.MAINNET && <p className="text-sm text-destructive font-medium">⚠️ Warning: Real KAS will be used!</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indexer Settings */}
          <Card className="border border-border rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Indexer Configuration</h2>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Indexer URL
                  </label>
                  <Input
                    type="url"
                    value={localApiBaseUrl}
                    onChange={(e) => handleApiUrlChange(e.target.value)}
                    onBlur={handleApiUrlBlur}
                    placeholder={window.location.protocol === 'https:' ? '/api or https://your-backend.com' : 'http://localhost:3000'}
                    className="text-sm rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                  />
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
                    <SelectOption value="resolver">Automatic (resolver)</SelectOption>
                    <SelectOption value="custom-node">Your Kaspa node</SelectOption>
                  </Select>
                </div>

                {/* Custom Node URL Input */}
                {kaspaConnectionType === 'custom-node' && (
                  <div className="space-y-2 mt-4">
                    <label className="block text-sm font-medium text-foreground">
                      Kaspa node URL
                    </label>
                    <Input
                      type="url"
                      value={customKaspaNodeUrl}
                      onChange={(e) => handleCustomNodeUrlChange(e.target.value)}
                      placeholder="wss://your-kaspa-node.com:16210 or 192.168.1.100:16210"
                      className="text-sm rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the IP address and port of your Kaspa node. Include protocol (ws:// or wss://) if needed.
                      <br />
                    </p>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;