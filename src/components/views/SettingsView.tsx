import React, { useState } from 'react';
import { Server, Network, Globe, HardDrive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectOption } from '@/components/ui/select';
import { useUserSettings, type KaspaNetwork, type KaspaConnectionType } from '@/contexts/UserSettingsContext';

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
    setCustomKaspaNodeUrl
  } = useUserSettings();

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  

  const handleApiUrlChange = (value: string) => {
    setApiBaseUrl(value);
    showSaveFeedback('Server URL updated');
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

  const showSaveFeedback = (message: string) => {
    setSaveFeedback(message);
    setTimeout(() => setSaveFeedback(null), 2000);
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-white bg-opacity-80 backdrop-blur-md border-b border-gray-200 p-4 z-10">
        <h1 className="text-lg sm:text-xl font-bold">Settings</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Configure your application preferences</p>
      </div>

      <div className="flex-1 overflow-y-scroll p-3 sm:p-4" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Save Feedback */}
          {saveFeedback && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-none">
              {saveFeedback}
            </div>
          )}

          {/* Current Settings Summary */}
          <Card className="border border-gray-200 rounded-none bg-gray-50">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700">Current Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Server</label>
                    <div className="bg-white border border-gray-200 p-2 font-mono text-xs">
                      {apiBaseUrl}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Network</label>
                    <div className="bg-white border border-gray-200 p-2 text-xs">
                      {getNetworkDisplayName(selectedNetwork)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Connection</label>
                    <div className="bg-white border border-gray-200 p-2 text-xs">
                      {kaspaConnectionType === 'resolver' ? 'Resolver (Automatic)' : 'Custom Node'}
                    </div>
                  </div>
                  
                  {kaspaConnectionType === 'custom-node' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Node URL</label>
                      <div className="bg-white border border-gray-200 p-2 font-mono text-xs break-all">
                        {customKaspaNodeUrl || 'Not configured'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Server Settings */}
          <Card className="border border-gray-200 rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Server className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">Server Configuration</h2>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Server URL
                  </label>
                  <Input
                    type="url"
                    value={apiBaseUrl}
                    onChange={(e) => handleApiUrlChange(e.target.value)}
                    placeholder={window.location.protocol === 'https:' ? '/api or https://your-backend.com' : 'http://localhost:3000'}
                    className="font-mono text-sm rounded-none"
                  />
                  <p className="text-xs text-gray-500">
                    The base URL for the API server that handles posts and social features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaspa Network Settings */}
          <Card className="border border-gray-200 rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Network className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">Kaspa Network</h2>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Network
                  </label>
                  <Select
                    value={selectedNetwork}
                    onChange={(e) => handleNetworkChange(e.target.value as KaspaNetwork)}
                    className="w-full"
                  >
                    {/* Temporary deactivation of mainnet
                    <SelectOption value="mainnet">Mainnet</SelectOption>}
                    */}
                    <SelectOption value="testnet-10">Testnet 10</SelectOption>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Choose which Kaspa network to use for transactions and wallet operations.
                    {selectedNetwork === 'mainnet' && ' ⚠️ Real KAS will be used!'}
                    {selectedNetwork !== 'mainnet' && ' Test network - no real KAS.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaspa Connection Settings */}
          <Card className="border border-gray-200 rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Globe className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">Kaspa Connection</h2>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
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
                  <p className="text-xs text-gray-500">
                    {kaspaConnectionType === 'resolver' 
                      ? 'Automatically connect to available Kaspa nodes using the resolver service.'
                      : 'Connect directly to your own Kaspa node for maximum control and privacy.'
                    }
                  </p>
                </div>

                {/* Custom Node URL Input */}
                {kaspaConnectionType === 'custom-node' && (
                  <div className="space-y-2 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-none">
                    <label className="block text-sm font-medium text-gray-700">
                      <HardDrive className="h-4 w-4 inline mr-2" />
                      Kaspa Node URL
                    </label>
                    <textarea
                      value={customKaspaNodeUrl}
                      onChange={(e) => handleCustomNodeUrlChange(e.target.value)}
                      placeholder="wss://your-kaspa-node.com:16210&#10;or&#10;192.168.1.100:16210"
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical rounded-none"
                      style={{ fontFamily: 'monospace' }}
                    />
                    <p className="text-xs text-gray-500">
                      Enter the IP address and port of your Kaspa node. Include protocol (ws:// or wss://) if needed.
                      <br />
                      Examples: <code className="bg-gray-200 px-1">192.168.1.100:16210</code> or <code className="bg-gray-200 px-1">wss://node.kaspa.org:16210</code>
                    </p>
                    
                    {customKaspaNodeUrl.trim() === '' && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-none">
                        <p className="text-sm text-yellow-700 font-medium">⚠️ Custom node URL required</p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Please enter your Kaspa node URL to use custom node connection.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-600 py-4">
            <p>Settings are automatically saved when changed.</p>
            <p className="mt-1">Some changes may require refreshing the page to take full effect.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;