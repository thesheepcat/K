import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, RefreshCw, Wallet, Key, CreditCard, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useKaspaAuth } from '@/hooks/useKaspaAuth';
import kaspaService from '@/services/kaspaService';
import PasswordConfirmDialog from '@/components/dialogs/PasswordConfirmDialog';

interface UtxoData {
  totalBalance: number;
  utxoCount: number;
  entries: any[];
  networkId?: string;
}

const ProfileView: React.FC = () => {
  const { privateKey, publicKey, address, unlockSession } = useAuth();
  const { selectedNetwork, getNetworkDisplayName, getNetworkRPCId } = useUserSettings();
  const { getNetworkAwareAddress } = useKaspaAuth();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [utxoData, setUtxoData] = useState<UtxoData | null>(null);
  const [isLoadingUtxo, setIsLoadingUtxo] = useState(false);
  const [utxoError, setUtxoError] = useState<string | null>(null);
  const [networkAwareAddress, setNetworkAwareAddress] = useState<string | null>(null);

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Password confirmation dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Send Coins state
  const [destinationAddress, setDestinationAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copied!`);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(null), 2000);
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
      if (kaspaConnectionType === 'custom-node' && customKaspaNodeUrl.trim()) {
        // Use custom node URL
        rpcConfig = {
          url: customKaspaNodeUrl.trim(),
          networkId: getNetworkRPCId(selectedNetwork)
        };
      } else {
        // Use resolver (default)
        rpcConfig = {
          resolver: new Resolver(),
          networkId: getNetworkRPCId(selectedNetwork)
        };
      }
      
      const rpc = new RpcClient(rpcConfig);
      
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

  const formatPublicKey = (key: string | null): string => {
    if (!key) return 'Not available';
    // Show first 8 and last 8 characters for public key
    if (key.length > 16) {
      return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
    }
    return key;
  };

  const formatAddress = (addr: string | null): string => {
    if (!addr) return 'Not available';
    // Show first 12 and last 8 characters for address
    if (addr.length > 20) {
      return `${addr.substring(0, 12)}...${addr.substring(addr.length - 8)}`;
    }
    return addr;
  };

  // Convert KAS to sompi (1 KAS = 100,000,000 sompi)
  const kasToSompi = (kas: number): bigint => {
    return BigInt(Math.round(kas * 100000000));
  };

  // Send coins function
  const handleSendCoins = async () => {
    if (!privateKey || !networkAwareAddress) {
      setSendError('Private key or address not available');
      return;
    }

    if (!destinationAddress.trim()) {
      setSendError('Please enter a destination address');
      return;
    }

    if (!sendAmount.trim() || isNaN(parseFloat(sendAmount)) || parseFloat(sendAmount) <= 0) {
      setSendError('Please enter a valid amount greater than 0');
      return;
    }

    const amountKAS = parseFloat(sendAmount);
    
    if (!utxoData || utxoData.totalBalance === 0) {
      setSendError('No funds available or UTXO data not loaded');
      return;
    }

    const availableKAS = utxoData.totalBalance / 100000000;
    if (amountKAS > availableKAS) {
      setSendError(`Insufficient funds. Available: ${formatKaspaAmount(utxoData.totalBalance)} KAS`);
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      await kaspaService.ensureLoaded();
      const kaspa = kaspaService.getKaspa();
      const { Resolver, createTransactions, RpcClient, PrivateKey, Address } = kaspa;

      // Get connection settings
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
      if (kaspaConnectionType === 'custom-node' && customKaspaNodeUrl.trim()) {
        rpcConfig = {
          url: customKaspaNodeUrl.trim(),
          networkId: getNetworkRPCId(selectedNetwork)
        };
      } else {
        rpcConfig = {
          resolver: new Resolver(),
          networkId: getNetworkRPCId(selectedNetwork)
        };
      }

      const rpc = new RpcClient(rpcConfig);
      await rpc.connect();

      const isConnected = await rpc.isConnected;
      if (!isConnected) {
        throw new Error('Failed to connect to Kaspa network');
      }

      const { networkId } = await rpc.getServerInfo();

      // Setup wallet
      const privateKeyObject = new PrivateKey(privateKey);
      const userAddressObject = privateKeyObject.toAddress(networkId);
      
      // Create destination address object
      let destinationAddressObject;
      try {
        const trimmedAddress = destinationAddress.trim();
        
        // Validate address format first using static validate method if available
        if (Address.validate && !Address.validate(trimmedAddress)) {
          throw new Error(`Address format validation failed`);
        }
        
        // Create address using constructor
        destinationAddressObject = new Address(trimmedAddress);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Invalid destination address: ${destinationAddress}. ${errorMsg}. Make sure it's a valid ${getNetworkDisplayName(selectedNetwork)} address.`);
      }

      // Get fresh UTXOs
      const { entries } = await rpc.getUtxosByAddresses([userAddressObject]);
      
      if (!entries || entries.length === 0) {
        throw new Error('No UTXOs found. Make sure the address has funds.');
      }

      // Calculate total balance from UTXOs
      let totalBalance = 0;
      for (const entry of entries) {
        const amount = entry?.utxoEntry?.amount || entry?.amount || 0;
        totalBalance += Number(amount);
      }

      const amountToSendSompi = kasToSompi(amountKAS);
      
      if (totalBalance < Number(amountToSendSompi)) {
        throw new Error(`Insufficient funds. Available: ${formatKaspaAmount(totalBalance)} KAS, Required: ${amountKAS} KAS`);
      }

      // Create transaction
      const { transactions } = await createTransactions({
        networkId,
        entries: entries,
        outputs: [{
          address: destinationAddressObject,
          amount: amountToSendSompi
        }],
        changeAddress: userAddressObject,
        priorityFee: 0n
      });

      if (!transactions || transactions.length === 0) {
        throw new Error('Failed to create transaction');
      }

      // Sign and submit transactions
      let totalFees = 0n;
      for (const transaction of transactions) {
        transaction.sign([privateKeyObject]);
        await transaction.submit(rpc);
        totalFees += transaction.feeAmount;
      }

      await rpc.disconnect();

      console.log(`Successfully sent ${amountKAS} KAS to ${destinationAddressObject.toString()}`);
      console.log(`Total fees: ${formatKaspaAmount(Number(totalFees))} KAS`);

      // Clear form and show success
      setDestinationAddress('');
      setSendAmount('');
      setSendSuccess(`Successfully sent ${amountKAS} KAS to ${destinationAddress}. Transaction fee: ${formatKaspaAmount(Number(totalFees))} KAS`);

      // Refresh UTXO data to show updated balance
      setTimeout(() => {
        loadUtxoData();
      }, 2000);

    } catch (error) {
      console.error('Error sending coins:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send coins';
      setSendError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Clear send form
  const clearSendForm = () => {
    setDestinationAddress('');
    setSendAmount('');
    setSendError(null);
    setSendSuccess(null);
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto border-r border-border flex flex-col h-full" data-main-content>
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <h1 className="text-lg sm:text-xl font-bold">Profile</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Your wallet and identity information</p>
      </div>

      <div className="flex-1 overflow-y-scroll p-3 sm:p-4" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Copy Feedback */}
          {copyFeedback && (
            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-none">
              {copyFeedback}
            </div>
          )}

          {/* Identity Information */}
          <Card className="border border-border rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Identity</h2>
                </div>
                
                {/* Public Key Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Public Key
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formatPublicKey(publicKey)}
                      readOnly
                      className="font-mono text-sm bg-muted rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                      title={publicKey || 'Not available'}
                    />
                    <Button
                      type="button"
                      onClick={() => copyToClipboard(publicKey || '', 'Public key')}
                      disabled={!publicKey}
                      size="sm"
                      variant="ghost"
                      className="rounded-none"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Used for post identification and verification</p>
                </div>

                {/* Kaspa Address Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    <Wallet className="h-4 w-4 inline mr-2" />
                    Kaspa Address
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formatAddress(networkAwareAddress)}
                      readOnly
                      className="font-mono text-sm bg-muted rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                      title={networkAwareAddress || 'Not available'}
                    />
                    <Button
                      type="button"
                      onClick={() => copyToClipboard(networkAwareAddress || '', 'Kaspa address')}
                      disabled={!networkAwareAddress}
                      size="sm"
                      variant="ghost"
                      className="rounded-none"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Your wallet address for {getNetworkDisplayName(selectedNetwork)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Private Key Section */}
          <Card className="border border-destructive/20 rounded-none bg-destructive/10">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Key className="h-5 w-5 text-destructive" />
                  <h2 className="text-lg font-semibold text-destructive">Private Key</h2>
                </div>
                
                <div className="bg-destructive/20 border border-destructive/30 p-4 rounded-none mb-4">
                  <p className="text-sm text-destructive font-medium">⚠️ Warning: Never share your private key with anyone!</p>
                  <p className="text-xs text-destructive/80 mt-1">Your private key gives full control over your wallet and funds.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-destructive">
                    Private Key
                  </label>
                  <div className="relative">
                    <Input
                      type={showPrivateKey ? 'text' : 'password'}
                      value={formatPrivateKey(privateKey)}
                      readOnly
                      className="pr-20 font-mono text-sm bg-background border-destructive/20 rounded-none focus-visible:ring-0"
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
                  <p className="text-xs text-destructive">Keep this secret and secure! Only reveal when you need to copy it.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Balance Section */}
          <Card className="border border-border rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Wallet Balance</h2>
                  </div>
                  <Button
                    type="button"
                    onClick={loadUtxoData}
                    disabled={isLoadingUtxo}
                    size="sm"
                    variant="ghost"
                    className="rounded-none"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingUtxo ? 'animate-loader-circle' : ''}`} />
                  </Button>
                </div>

                {isLoadingUtxo && (
                  <div className="bg-muted border border-border p-4 rounded-none text-center">
                    <div className="w-6 h-6 border-2 border-transparent rounded-full animate-loader-circle mx-auto mb-2" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                    <p className="text-sm text-muted-foreground">Loading wallet data...</p>
                  </div>
                )}

                {utxoError && (
                  <div className="bg-warning/10 border border-warning/20 p-4 rounded-none">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Total Balance</label>
                        <div className="bg-background border border-border p-3 font-mono text-sm">
                          {formatKaspaAmount(utxoData.totalBalance)} KAS
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">UTXOs Count</label>
                        <div className="bg-background border border-border p-3 font-mono text-sm">
                          {utxoData.utxoCount}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Active Network</label>
                      <div className="bg-background border border-border p-3 text-sm">
                        {getNetworkDisplayName(selectedNetwork)}
                      </div>
                    </div>
                  </div>
                )}

                {!utxoData && !isLoadingUtxo && !utxoError && (
                  <div className="bg-muted border border-border p-4 rounded-none text-center text-muted-foreground">
                    <p className="text-sm">No wallet data loaded. Click refresh to load.</p>
                  </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Send Coins Section */}
          <Card className="border border-border rounded-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Send className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Send Coins</h2>
                </div>

                {/* Send Success Message */}
                {sendSuccess && (
                  <div className="bg-success/10 border border-success/20 p-4 rounded-none">
                    <p className="text-sm text-success font-medium">✅ Transaction Successful</p>
                    <p className="text-xs text-success/80 mt-1">{sendSuccess}</p>
                  </div>
                )}

                {/* Send Error Message */}
                {sendError && (
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-none">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-destructive font-medium">Transaction Failed</p>
                        <p className="text-xs text-destructive/80 mt-1">{sendError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning Message */}
                <div className="bg-warning/10 border border-warning/20 p-4 rounded-none">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-warning font-medium">⚠️ Important</p>
                      <p className="text-xs text-warning/80 mt-1">
                        Double-check the destination address before sending. Transactions cannot be reversed.
                        {selectedNetwork === 'mainnet' && ' You are using MAINNET - real KAS will be sent!'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Balance Display */}
                {utxoData && (
                  <div className="bg-muted border border-border p-3 rounded-none">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Available Balance:</span>
                      <span className="font-mono text-sm font-medium">
                        {formatKaspaAmount(utxoData.totalBalance)} KAS
                      </span>
                    </div>
                  </div>
                )}

                {/* Send Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Destination Address
                    </label>
                    <Input
                      type="text"
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      placeholder={`kaspa${selectedNetwork !== 'mainnet' ? 'test' : ''}:qq...`}
                      className="font-mono text-sm rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                      disabled={isSending}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the {getNetworkDisplayName(selectedNetwork)} address to send coins to
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Amount (KAS)
                    </label>
                    <Input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00000000"
                      step="0.00000001"
                      min="0"
                      className="font-mono text-sm rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                      disabled={isSending}
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount in KAS to send (minimum: 0.00000001 KAS)
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleSendCoins}
                      disabled={isSending || !utxoData || utxoData.totalBalance === 0 || !destinationAddress.trim() || !sendAmount.trim()}
                      className="flex-1 rounded-none bg-foreground text-background hover:bg-foreground/80"
                    >
                      {isSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle mr-2" style={{borderColor: 'hsl(var(--background))'}}></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Coins
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={clearSendForm}
                      disabled={isSending}
                      variant="outline"
                      className="rounded-none"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Transaction Fee Information */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Transaction Information:</p>
                  <p>• Network fees are automatically calculated and deducted</p>
                  <p>• Transactions are typically confirmed within minutes</p>
                  <p>• Your balance will update automatically after confirmation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Footer */}
          <Card className="border border-border rounded-none bg-muted">
            <CardContent className="p-6">
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Security Information</p>
                <p>Your wallet information is fetched directly from the Kaspa network.</p>
                <p>Private keys are stored locally in your browser and never transmitted to our servers.</p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  Configure network settings and connection preferences in Settings.
                </p>
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
        title="Reveal Private Key"
        message="Please enter your password to reveal your private key. Never share your private key with anyone!"
        isLoading={isVerifyingPassword}
      />
    </div>
  );
};

export default ProfileView;