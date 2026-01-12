import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Copy, RefreshCw, Key, CreditCard, Send, User, QrCode, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectOption } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useKaspaAuth } from '@/hooks/useKaspaAuth';
import kaspaService from '@/services/kaspaService';
import PasswordConfirmDialog from '@/components/dialogs/PasswordConfirmDialog';
import QRCodeDialog from '@/components/dialogs/QRCodeDialog';
import SendCoinConfirmDialog from '@/components/dialogs/SendCoinConfirmDialog';
import { KASPA_NETWORKS } from '@/constants/networks';
import { toast } from 'sonner';
import ProfileIntroduceBox from '@/components/general/ProfileIntroduceBox';
import QRCodeLib from 'qrcode';
import { sendCoinTransaction, sendSingleUtxoTransaction } from '@/utils/sendTransaction';
import { getExplorerTransactionUrl, getExplorerAddressUrl } from '@/utils/explorerUtils';

interface UtxoData {
  totalBalance: number;
  utxoCount: number;
  entries: any[];
  networkId?: string;
}

const ProfileView: React.FC = () => {
  const navigate = useNavigate();
  const { privateKey, publicKey, address, unlockSession } = useAuth();
  const { selectedNetwork, getNetworkRPCId } = useUserSettings();
  const { getNetworkAwareAddress } = useKaspaAuth();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [utxoData, setUtxoData] = useState<UtxoData | null>(null);
  const [isLoadingUtxo, setIsLoadingUtxo] = useState(false);
  const [utxoError, setUtxoError] = useState<string | null>(null);
  const [networkAwareAddress, setNetworkAwareAddress] = useState<string | null>(null);

  // Password confirmation dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // QR Code dialog state
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');

  // Send Coins state
  const [destinationAddress, setDestinationAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendOperationType, setSendOperationType] = useState<'amount' | 'utxo'>('amount');

  // Send Coin confirmation dialog state
  const [showSendCoinDialog, setShowSendCoinDialog] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    // Fallback function using older API
    const fallbackCopy = (text: string): boolean => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    };

    try {
      // Try modern clipboard API first, but with a catch for failures
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          toast.success('Copied!', {
            description: `${label} copied to clipboard`,
            duration: 2000,
          });
          return;
        } catch (clipboardError) {
          // Modern API failed, fall through to fallback
          console.log('Modern clipboard API failed, using fallback:', clipboardError);
        }
      }

      // Use fallback method
      const success = fallbackCopy(text);
      if (success) {
        toast.success('Copied!', {
          description: `${label} copied to clipboard`,
          duration: 2000,
        });
      } else {
        throw new Error('Fallback copy method failed');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Copy failed', {
        description: 'Failed to copy to clipboard',
        duration: 2000,
      });
    }
  };

  const formatKaspaAmount = (amount: number): string => {
    // Handle invalid amounts
    if (isNaN(amount) || amount < 0) {
      return '0.00000000';
    }
    
    // Convert from sompi to KAS (1 KAS = 100,000,000 sompi)
    const kas = amount / 100000000;
    return kas.toLocaleString('en-US', { 
      minimumFractionDigits: 8, 
      maximumFractionDigits: 8 
      });
  };

  const loadUtxoData = async () => {
    // Get network-aware address
    const currentAddress = await getNetworkAwareAddress();
    setNetworkAwareAddress(currentAddress);

    if (!currentAddress) {
      setUtxoError('No address available');
      return;
    }

    setIsLoadingUtxo(true);
    setUtxoError(null);

    let rpc: any = null;

    try {
      await kaspaService.ensureLoaded();
      const kaspa = kaspaService.getKaspa();
      const { Resolver, RpcClient } = kaspa;

      // Get connection settings from user settings
      const storedSettings = localStorage.getItem('kaspa_user_settings');
      let kaspaConnectionType = 'resolver';
      let customKaspaNodeUrl = '';

      if (storedSettings) {
        try {
          const settings = JSON.parse(storedSettings);
          kaspaConnectionType = settings.kaspaConnectionType || 'resolver';
          customKaspaNodeUrl = settings.customKaspaNodeUrl || '';
        } catch (error) {
          console.error('Error parsing settings:', error);
        }
      }

      let rpcConfig;
      if (kaspaConnectionType === 'public-node') {
        // Use public node
        rpcConfig = {
          url: 'wss://node.k-social.network',
          networkId: getNetworkRPCId(selectedNetwork)
        };
      } else if (kaspaConnectionType === 'custom-node' && customKaspaNodeUrl.trim()) {
        // Use custom node URL
        rpcConfig = {
          url: customKaspaNodeUrl.trim(),
          networkId: getNetworkRPCId(selectedNetwork)
        };
      } else {
        // Use resolver (default for 'resolver' type or fallback)
        rpcConfig = {
          resolver: new Resolver(),
          networkId: getNetworkRPCId(selectedNetwork)
        };
      }

      rpc = new RpcClient(rpcConfig);

      await rpc.connect();
      const isConnected = await rpc.isConnected;
      
      if (!isConnected) {
        throw new Error('Failed to connect to Kaspa network');
      }

      const { networkId } = await rpc.getServerInfo();
      
      try {
        const { entries } = await rpc.getUtxosByAddresses([currentAddress]);
        
        // Handle case where entries might be null, undefined, or empty
        if (!entries || entries.length === 0) {
          setUtxoData({
            totalBalance: 0,
            utxoCount: 0,
            entries: [],
            networkId
          });
          await rpc.disconnect();
          return;
        }

        // Calculate total balance and UTXO count
        let totalBalance = 0;
        const validEntries = [];

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];

          try {
            // Handle different possible structures for amount
            let amount = 0;

            // Try different property paths for amount
            if (entry?.utxoEntry?.amount !== undefined) {
              amount = Number(entry.utxoEntry.amount);
            } else if (entry?.amount !== undefined) {
              amount = Number(entry.amount);
            } else if (entry?.value !== undefined) {
              amount = Number(entry.value);
            } else {
              continue; // Skip this entry
            }

            totalBalance += amount;
            validEntries.push(entry);

          } catch (entryError) {
            // Continue with other entries
          }
        }

        setUtxoData({
          totalBalance,
          utxoCount: validEntries.length,
          entries: validEntries,
          networkId
        });

      } catch (utxoError: unknown) {
        const errorMessage = utxoError instanceof Error ? utxoError.message : String(utxoError);
        throw new Error(`Failed to fetch UTXOs: ${errorMessage}`);
      }

      await rpc.disconnect();
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to fetch UTXO data';
      setUtxoError(`${errorMessage}. This is normal for new addresses with no transactions.`);
    } finally {
      // Ensure RPC is disconnected even if an error occurred
      if (rpc) {
        try {
          await rpc.disconnect();
        } catch (disconnectError) {
          console.error("Error disconnecting RPC:", disconnectError);
        }
      }
      setIsLoadingUtxo(false);
    }
  };

  // Load UTXO data on component mount and when network changes
  useEffect(() => {
    loadUtxoData();
  }, [address, selectedNetwork]);

  const togglePrivateKeyVisibility = () => {
    if (!showPrivateKey) {
      // Show password confirmation dialog before revealing private key
      setShowPasswordDialog(true);
    } else {
      // Hide private key immediately
      setShowPrivateKey(false);
    }
  };

  const handlePasswordConfirm = async (password: string): Promise<boolean> => {
    setIsVerifyingPassword(true);
    try {
      // Use the unlockSession function to verify the password
      const success = await unlockSession(password);
      if (success) {
        setShowPrivateKey(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const formatPrivateKey = (key: string | null): string => {
    if (!key) return 'Not available';
    if (!showPrivateKey) {
      return '•'.repeat(64);
    }
    return key;
  };

  // Validate and show confirmation dialog for sending coins
  const handleSendCoins = () => {
    if (!privateKey || !networkAwareAddress) {
      toast.error('Transaction failed', {
        description: 'Private key or address not available',
        duration: 5000,
      });
      return;
    }

    if (!destinationAddress.trim()) {
      toast.error('Transaction failed', {
        description: 'Please enter a destination address',
        duration: 5000,
      });
      return;
    }

    if (!sendAmount.trim() || isNaN(parseFloat(sendAmount)) || parseFloat(sendAmount) <= 0) {
      toast.error('Transaction failed', {
        description: 'Please enter a valid amount greater than 0',
        duration: 5000,
      });
      return;
    }

    const amountKAS = parseFloat(sendAmount);

    if (!utxoData || utxoData.totalBalance === 0) {
      toast.error('Transaction failed', {
        description: 'No funds available or UTXO data not loaded',
        duration: 5000,
      });
      return;
    }

    const availableKAS = utxoData.totalBalance / 100000000;
    if (amountKAS > availableKAS) {
      toast.error('Transaction failed', {
        description: `Insufficient funds. Available: ${formatKaspaAmount(utxoData.totalBalance)} KAS`,
        duration: 5000,
      });
      return;
    }

    // Show confirmation dialog
    setShowSendCoinDialog(true);
  };

  // Perform the actual send transaction after confirmation
  const performSendCoins = async () => {
    if (!privateKey) return;

    const amountKAS = parseFloat(sendAmount);

    setIsSending(true);

    try {
      const result = await sendCoinTransaction({
        privateKey,
        destinationAddress: destinationAddress.trim(),
        amountKAS,
        networkId: getNetworkRPCId(selectedNetwork)
      });

      if (!result) {
        throw new Error('Transaction failed to return result');
      }

      // Show success toast
      toast.success('Transaction successful!', {
        description: (
          <div className="space-y-2">
            <div>Successfully sent {amountKAS} KAS to {destinationAddress}</div>
            <div>Transaction fee: {result.feeKAS} KAS</div>
            <button
              onClick={() => window.open(getExplorerTransactionUrl(result.id, selectedNetwork), '_blank')}
              className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Open explorer
            </button>
          </div>
        ),
        duration: 5000
      });

      // Clear form and reset sending state
      setIsSending(false);
      setDestinationAddress('');
      setSendAmount('');

      // Refresh UTXO data to show updated balance
      setTimeout(() => {
        loadUtxoData();
      }, 2000);

    } catch (error) {
      console.error('Error sending coins:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send coins';
      toast.error('Transaction failed', {
        description: errorMessage,
        duration: 5000,
      });
      setIsSending(false);
    }
  };

  // Validate and show confirmation dialog for sending single UTXO
  const handleSendSingleUtxo = () => {
    if (!privateKey || !networkAwareAddress) {
      toast.error('Transaction failed', {
        description: 'Private key or address not available',
        duration: 5000,
      });
      return;
    }

    if (!destinationAddress.trim()) {
      toast.error('Transaction failed', {
        description: 'Please enter a destination address',
        duration: 5000,
      });
      return;
    }

    if (!utxoData || utxoData.totalBalance === 0) {
      toast.error('Transaction failed', {
        description: 'No funds available or UTXO data not loaded',
        duration: 5000,
      });
      return;
    }

    // Show confirmation dialog
    setShowSendCoinDialog(true);
  };

  // Perform the actual send single UTXO transaction after confirmation
  const performSendSingleUtxo = async () => {
    if (!privateKey) return;

    setIsSending(true);

    try {
      const result = await sendSingleUtxoTransaction({
        privateKey,
        destinationAddress: destinationAddress.trim(),
        networkId: getNetworkRPCId(selectedNetwork)
      });

      if (!result) {
        throw new Error('Transaction failed to return result');
      }

      // Show success toast
      toast.success('Transaction successful!', {
        description: (
          <div className="space-y-2">
            <div>Successfully sent single UTXO to {destinationAddress}</div>
            <div>Transaction fee: {result.feeKAS} KAS</div>
            <button
              onClick={() => window.open(getExplorerTransactionUrl(result.id, selectedNetwork), '_blank')}
              className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Open explorer
            </button>
          </div>
        ),
        duration: 5000
      });

      // Clear form and reset sending state
      setIsSending(false);
      setDestinationAddress('');
      setSendAmount('');

      // Refresh UTXO data to show updated balance
      setTimeout(() => {
        loadUtxoData();
      }, 2000);

    } catch (error) {
      console.error('Error sending single UTXO:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send single UTXO';
      toast.error('Transaction failed', {
        description: errorMessage,
        duration: 5000,
      });
      setIsSending(false);
    }
  };

  // Handler for confirmation dialog - calls appropriate send function
  const handleConfirmSend = () => {
    if (sendOperationType === 'amount') {
      performSendCoins();
    } else {
      performSendSingleUtxo();
    }
  };

  // Clear send form
  const clearSendForm = () => {
    setDestinationAddress('');
    setSendAmount('');
    setSendOperationType('amount'); // Reset to default
  };

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setDestinationAddress(text.trim());
    } catch (error) {
      toast.error('Failed to paste from clipboard', {
        description: 'Please check clipboard permissions',
        duration: 3000,
      });
    }
  };

  // Generate and show QR code for address
  const handleShowQRCode = async () => {
    if (!networkAwareAddress) {
      toast.error('Error', {
        description: 'No address available',
        duration: 2000,
      });
      return;
    }

    try {
      // Generate QR code as data URL
      const dataURL = await QRCodeLib.toDataURL(networkAwareAddress, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataURL(dataURL);
      setShowQRDialog(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Error', {
        description: 'Failed to generate QR code',
        duration: 2000,
      });
    }
  };


  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full" data-main-content>
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
          <h1 className="text-lg sm:text-xl font-bold">Profile</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-scroll p-3 sm:p-4" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Your Profile Section */}
          <ProfileIntroduceBox />

          {/* Identity Information */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Identity</h2>
                </div>

                {/* Public Key Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Your public key
                  </label>
                  <div className="relative">
                    <Input
                      value={publicKey || 'Not available'}
                      readOnly
                      className="pr-10 text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                    />
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(publicKey || '', 'Public key')}
                        disabled={!publicKey}
                        className="p-1 text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-50"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kaspa Address Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Your address
                  </label>
                  <div className="relative">
                    <Input
                      value={networkAwareAddress || 'Not available'}
                      readOnly
                      className="pr-28 text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                    />
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => window.open(getExplorerAddressUrl(networkAwareAddress || '', selectedNetwork), '_blank')}
                        disabled={!networkAwareAddress}
                        className="p-1 text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-50"
                        title="View in explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleShowQRCode}
                        disabled={!networkAwareAddress}
                        className="p-1 text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-50"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(networkAwareAddress || '', 'Kaspa address')}
                        disabled={!networkAwareAddress}
                        className="p-1 text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-50"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-destructive font-medium">⚠️ Warning: Send only small amounts of KAS (1-5 KAS max)!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Private Key Section */}
          <Card className="border border-destructive/20 bg-destructive/10">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Key className="h-5 w-5 text-destructive" />
                  <h2 className="text-lg font-semibold text-destructive">Private key</h2>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-destructive">
                    Your private key
                  </label>
                  <div className="relative">
                    <Input
                      type={showPrivateKey ? 'text' : 'password'}
                      value={formatPrivateKey(privateKey)}
                      readOnly
                      className="pr-20 text-sm bg-muted border-destructive/20 focus-visible:ring-0"
                    />
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={togglePrivateKeyVisibility}
                        disabled={!privateKey}
                        className="p-1 text-destructive/60 hover:text-destructive disabled:opacity-50"
                      >
                        {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(privateKey || '', 'Private key')}
                        disabled={!privateKey || !showPrivateKey}
                        className="p-1 text-destructive/60 hover:text-destructive disabled:opacity-50"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>  
                  <p className="text-sm text-destructive font-medium">⚠️ Warning: Never share your private key!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Balance Section */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Wallet balance</h2>
                  </div>
                  <Button
                    type="button"
                    onClick={loadUtxoData}
                    disabled={isLoadingUtxo}
                    size="sm"
                    variant="ghost"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingUtxo ? 'animate-loader-circle' : ''}`} />
                  </Button>
                </div>

                {isLoadingUtxo && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Total balance
                      </label>
                      <div className="relative">
                        <Input
                          value=""
                          readOnly
                          className="text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        UTXOs count
                      </label>
                      <div className="relative">
                        <Input
                          value=""
                          readOnly
                          className="text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {utxoError && (
                  <div className="bg-warning/10 border border-warning/20 p-4 rounded-md">
                    <p className="text-sm text-warning">
                      <strong>Note:</strong> {utxoError}
                    </p>
                    <p className="text-xs text-warning/80 mt-1">
                      If this is a new address, fund it with some Kaspa to see balance information.
                    </p>
                  </div>
                )}

                {utxoData && !isLoadingUtxo && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Total balance
                      </label>
                      <Input
                        value={`${formatKaspaAmount(utxoData.totalBalance)} KAS`}
                        readOnly
                        className="text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        UTXOs count
                      </label>
                      <Input
                        value={utxoData.utxoCount.toString()}
                        readOnly
                        className="text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                      />
                    </div>
                  </div>
                )}

                {!utxoData && !isLoadingUtxo && !utxoError && (
                  <div className="bg-muted border border-border p-4 rounded-md text-center text-muted-foreground">
                    <p className="text-sm">No wallet data loaded. Click refresh to load.</p>
                  </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Send Coins Section */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Send className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Send coins</h2>
                </div>

                {/* Send Form */}
                <div className="space-y-4">
                  {/* Destination Address Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Destination Address
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        placeholder={`kaspa${selectedNetwork !== KASPA_NETWORKS.MAINNET ? 'test' : ''}:qq...`}
                        className="pr-10 text-sm border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                        disabled={isSending}
                      />
                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                        <button
                          type="button"
                          onClick={pasteFromClipboard}
                          disabled={isSending}
                          className="p-1 text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-50"
                          title="Paste from clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-destructive font-medium">⚠️ Warning: Double-check the destination address!</p>

                  {/* Operation Type Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Operation Type
                    </label>
                    <Select
                      value={sendOperationType}
                      onChange={(e) => setSendOperationType(e.target.value as 'amount' | 'utxo')}
                      className="w-full"
                      disabled={isSending}
                    >
                      <SelectOption value="amount">Send specific amount</SelectOption>
                      <SelectOption value="utxo">Send single UTXO</SelectOption>
                    </Select>
                  </div>

                  {/* Amount Field - Shows only when 'amount' operation is selected */}
                  {sendOperationType === 'amount' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Amount (KAS)
                      </label>
                      <Input
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="0.0"
                        step="0.1"
                        min="0"
                        className="text-sm border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                        disabled={isSending}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      onClick={clearSendForm}
                      disabled={isSending}
                      variant="outline"
                    >
                      Clear
                    </Button>

                    <Button
                      onClick={sendOperationType === 'utxo' ? handleSendSingleUtxo : handleSendCoins}
                      disabled={
                        isSending ||
                        !utxoData ||
                        utxoData.totalBalance === 0 ||
                        !destinationAddress.trim() ||
                        (sendOperationType === 'amount' && !sendAmount.trim())
                      }
                    >
                      {isSending && (
                        <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle-white mr-2"></div>
                      )}
                      {isSending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Confirmation Dialog */}
      <PasswordConfirmDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onConfirm={handlePasswordConfirm}
        isLoading={isVerifyingPassword}
      />

      {/* QR Code Dialog */}
      <QRCodeDialog
        isOpen={showQRDialog}
        onClose={() => setShowQRDialog(false)}
        address={networkAwareAddress || ''}
        qrCodeDataURL={qrCodeDataURL}
        onCopyAddress={() => copyToClipboard(networkAwareAddress || '', 'Kaspa address')}
      />

      {/* Send Coin Confirmation Dialog */}
      <SendCoinConfirmDialog
        isOpen={showSendCoinDialog}
        onClose={() => setShowSendCoinDialog(false)}
        onConfirm={handleConfirmSend}
        destinationAddress={destinationAddress}
        amount={sendAmount}
        operationType={sendOperationType}
      />
    </div>
  );
};

export default ProfileView;