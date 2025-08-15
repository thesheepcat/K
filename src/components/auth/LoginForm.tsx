import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Key, Copy, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import KaspaLogo from '../icons/KaspaLogo';

const LoginForm: React.FC = () => {
  const { login, generateNewKeyPair } = useAuth();
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<{
    privateKey: string;
    publicKey: string;
    address: string;
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleGenerateKeyPair = async () => {
    try {
      setLoading(true);
      setError('');
      const keys = await generateNewKeyPair();
      setGeneratedKeys(keys);
      setPrivateKey(keys.privateKey);
    } catch (err) {
      setError('Failed to generate key pair');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPrivateKey(text);
      setGeneratedKeys(null); // Clear generated keys when pasting
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!privateKey.trim()) {
      setError('Private key is required');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(privateKey, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md md:max-w-xl">
        <div className="text-center mb-8">
          <KaspaLogo className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Your voice. Your ideas. Uncensored. 
          </h1>
          <h2 className="text-xl font-bold text-foreground">Sign in</h2>
          <p className="text-muted-foreground mt-3">Enter your private key or generate a new one</p>
          <p className="text-muted-foreground mt-3">And just relax: we don't want your current wallet private key</p>
        </div>

        <Card className="border border-border rounded-none shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-none">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-destructive mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-destructive font-medium">Error</p>
                      <p className="text-xs text-destructive/80 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Copy Feedback */}
              {copyFeedback && (
                <div className="bg-success/10 border border-success/20 p-4 rounded-none">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-success mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-success font-medium">Success</p>
                      <p className="text-xs text-success/80 mt-1">{copyFeedback}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Generation Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    onClick={handleGenerateKeyPair}
                    disabled={loading}
                    className="flex-1 bg-muted text-muted-foreground hover:bg-muted/80 border border-border rounded-none"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-loader-circle' : ''}`} />
                    Generate New Key
                  </Button>
                  {/* 
                  <Button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="flex-1 bg-muted text-muted-foreground hover:bg-muted/80 border border-border rounded-none"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Paste from Clipboard
                  </Button>
                  */}
                </div>
              </div>

              {/* Private Key Input */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="privateKey" className="block text-sm font-medium text-foreground">
                    Private Key
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="privateKey"
                    type={showPrivateKey ? 'text' : 'password'}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your private key - Don't use your wallet private key"
                    className={`rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0 ${generatedKeys ? 'pr-20' : 'pr-10'}`}
                    required
                  />
                  {generatedKeys && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedKeys.privateKey, 'Private key')}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      title="Copy private key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  >
                    {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Generated Keys Display */}
              {generatedKeys && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Public Key</label>
                  <div className="relative">
                    <Input
                      value={generatedKeys.publicKey}
                      readOnly
                      className="text-xs font-mono bg-background rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedKeys.publicKey, 'Public key')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      title="Copy public key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password (for encryption)
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to encrypt your private key"
                    className="pr-10 rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pr-10 rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 font-bold rounded-none"
                >
                  <Key className="h-4 w-4 mr-2" />
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Your private key will be encrypted and stored securely in your browser.</p>
          <p className="mt-1">Make sure to remember your password!</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;