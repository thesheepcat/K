import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Network, Globe, Palette, Info, RefreshCw, Code, ArrowLeft, Github, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectOption } from '@/components/ui/select';
import { useUserSettings, type KaspaNetwork, type KaspaConnectionType, type IndexerType, type Theme } from '@/contexts/UserSettingsContext';
import { KASPA_NETWORKS } from '@/constants/networks';
import { fetchHealthCheck, type HealthCheckResponse } from '@/services/postsApi';
import { toast } from 'sonner';
import { normalizeApiUrl } from '@/utils/urlUtils';
import packageJson from '../../../package.json';

const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedNetwork,
    setSelectedNetwork,
    getNetworkDisplayName,
    apiBaseUrl,
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
    showSuccessNotifications,
    setShowSuccessNotifications,
    autoRenderImages,
    setAutoRenderImages,
    autoRenderVideos,
    setAutoRenderVideos
  } = useUserSettings();

  const [localCustomIndexerUrl, setLocalCustomIndexerUrl] = useState<string>(customIndexerUrl);
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await fetchHealthCheck(apiBaseUrl);
      setHealthData(data);
      toast.success('Health check completed', {
        description: `Connected to ${data.service} v${data.version} on ${data.network}`
      });
    } catch (error) {
      console.error('Failed to check health:', error);
      setHealthData(null);
      toast.error('Health check failed', {
        description: 'Unable to connect to the indexer server. Please verify the URL.'
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleIndexerTypeChange = (type: IndexerType) => {
    setIndexerType(type);
    // Don't clear custom indexer URL when switching away - preserve it for later use
  };

  const handleCustomIndexerUrlChange = (value: string) => {
    setLocalCustomIndexerUrl(value);
  };

  const handleCustomIndexerUrlBlur = () => {
    // Normalize the URL (removes trailing slashes, adds protocol if needed)
    const normalized = normalizeApiUrl(localCustomIndexerUrl);

    // Update local state with normalized value
    setLocalCustomIndexerUrl(normalized);

    // Save if different from current value
    if (normalized !== customIndexerUrl) {
      setCustomIndexerUrl(normalized);
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
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-scroll p-3 sm:p-4" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Current Settings Summary */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Current Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Network</label>
                    <div className="bg-muted border border-border p-2 text-sm rounded-md">
                      {getNetworkDisplayName(selectedNetwork)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Indexer</label>
                    <div className="bg-muted border border-border p-2 text-sm rounded-md">
                      {indexerType === 'public' ? 'Public indexer #01' : indexerType === 'local' ? 'Local Indexer (/api)' : 'Custom Indexer'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Connection</label>
                    <div className="bg-muted border border-border p-2 text-sm rounded-md">
                      {kaspaConnectionType === 'public-node' ? 'Public node #1' : kaspaConnectionType === 'resolver' ? 'Automatic (resolver)' : 'Custom Node'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Theme</label>
                    <div className="bg-muted border border-border p-2 text-sm capitalize rounded-md">
                      {theme}
                    </div>
                  </div>

                  {kaspaConnectionType === 'custom-node' && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Node URL</label>
                      <div className="bg-muted border border-border p-2 text-sm break-all rounded-md">
                        {customKaspaNodeUrl || 'Not configured'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaspa Network Settings */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Network className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Kaspa network</h2>
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
                    <SelectOption value={KASPA_NETWORKS.MAINNET}>Mainnet</SelectOption>
                    <SelectOption value={KASPA_NETWORKS.TESTNET_10}>Testnet 10</SelectOption>
                  </Select>
                    {selectedNetwork === KASPA_NETWORKS.MAINNET && <p className="text-sm text-destructive font-medium">⚠️ Warning: Real KAS will be used!</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indexer Settings */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Indexer configuration</h2>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Indexer
                  </label>
                  <Select
                    value={indexerType}
                    onChange={(e) => handleIndexerTypeChange(e.target.value as IndexerType)}
                    className="w-full"
                  >
                    <SelectOption value="public">Public indexer #01</SelectOption>
                    <SelectOption value="local">Local Indexer (/api)</SelectOption>
                    <SelectOption value="custom">Custom indexer</SelectOption>
                  </Select>
                </div>

                {/* Custom Indexer URL Input */}
                {indexerType === 'custom' && (
                  <div className="space-y-2 mt-4">
                    <label className="block text-sm font-medium text-foreground">
                      Indexer URL
                    </label>
                    <Input
                      type="text"
                      value={localCustomIndexerUrl}
                      onChange={(e) => handleCustomIndexerUrlChange(e.target.value)}
                      onBlur={handleCustomIndexerUrlBlur}
                      placeholder={window.location.protocol === 'https:' ? 'https://indexer.example.com' : 'http://localhost:3000'}
                      className="text-sm border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports: /api, example.com, example.com:5000, https://example.com, http://192.168.1.1:5200
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kaspa Connection Settings */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Kaspa node connection</h2>
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
                    <SelectOption value="public-node">Public node #1</SelectOption>
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
                      className="text-sm border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
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
          <Card className="border border-border">
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

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Transaction notifications
                  </label>
                  <Select
                    value={showSuccessNotifications ? 'show' : 'hide'}
                    onChange={(e) => setShowSuccessNotifications(e.target.value === 'show')}
                    className="w-full"
                  >
                    <SelectOption value="show">All notifications</SelectOption>
                    <SelectOption value="hide">Errors only</SelectOption>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Images rendering
                  </label>
                  <Select
                    value={autoRenderImages ? 'auto' : 'manual'}
                    onChange={(e) => setAutoRenderImages(e.target.value === 'auto')}
                    className="w-full"
                  >
                    <SelectOption value="auto">Automatic</SelectOption>
                    <SelectOption value="manual">Click to reveal</SelectOption>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Videos rendering
                  </label>
                  <Select
                    value={autoRenderVideos ? 'auto' : 'manual'}
                    onChange={(e) => setAutoRenderVideos(e.target.value === 'auto')}
                    className="w-full"
                  >
                    <SelectOption value="auto">Automatic</SelectOption>
                    <SelectOption value="manual">Click to reveal</SelectOption>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Software Versions */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Code className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Software versions</h2>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    K Version
                  </label>
                  <Input
                    type="text"
                    value={packageJson.version}
                    readOnly
                    className="text-sm border-input-thin bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Indexer Version
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={healthData ? healthData.version : 'Click to refresh data'}
                      readOnly
                      className="text-sm border-input-thin bg-muted"
                    />
                    <Button
                      type="button"
                      onClick={handleCheckHealth}
                      disabled={isCheckingHealth}
                      size="sm"
                      variant="ghost"
                    >
                      <RefreshCw className={`h-4 w-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Official Code Repository */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Github className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Official code repository</h2>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    K repository
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value="github.com/thesheepcat/K"
                      readOnly
                      className="text-sm border-input-thin bg-muted"
                    />
                    <Button
                      type="button"
                      onClick={() => window.open('https://github.com/thesheepcat/K/', '_blank', 'noopener,noreferrer')}
                      size="sm"
                      variant="ghost"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    K-indexer repository
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value="github.com/thesheepcat/K-indexer"
                      readOnly
                      className="text-sm border-input-thin bg-muted"
                    />
                    <Button
                      type="button"
                      onClick={() => window.open('https://github.com/thesheepcat/K-indexer', '_blank', 'noopener,noreferrer')}
                      size="sm"
                      variant="ghost"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
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