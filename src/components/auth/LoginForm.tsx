import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Key, Copy, RefreshCw } from 'lucide-react';
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md md:max-w-xl">
        <div className="text-center mb-8">
          <KaspaLogo className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your voice. Your ideas. Uncensored. 
          </h1>
          <h2 className="text-xl font-bold text-gray-900">Sign in</h2>
          <p className="text-gray-600 mt-3">Enter your private key or generate a new one</p>
          <p className="text-gray-600 mt-3">And just relax: we don't want your current wallet private key</p>
        </div>

        <Card className="border border-gray-200 rounded-none">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none">
                  {error}
                </div>
              )}

              {/* Copy Feedback */}
              {copyFeedback && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-none">
                  {copyFeedback}
                </div>
              )}

              {/* Key Generation Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    onClick={handleGenerateKeyPair}
                    disabled={loading}
                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 rounded-none"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Generate New Key
                  </Button>
                  {/* 
                  <Button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 rounded-none"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Paste from Clipboard
                  </Button>
                  */}
                </div>
              </div>

              {/* Private Key Input */}
              <div className="space-y-2">
                <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700">
                  Private Key
                </label>
                <div className="relative">
                  <Input
                    id="privateKey"
                    type={showPrivateKey ? 'text' : 'password'}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your private key - Don't use your wallet private key"
                    className={`rounded-none ${generatedKeys ? 'pr-20' : 'pr-10'}`}
                    required
                  />
                  {generatedKeys && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedKeys.privateKey, 'Private key')}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Copy private key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Generated Keys Display */}
              {generatedKeys && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Public Key</label>
                  <div className="relative">
                    <Input
                      value={generatedKeys.publicKey}
                      readOnly
                      className="text-xs font-mono bg-white rounded-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedKeys.publicKey, 'Public key')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Copy public key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password (for encryption)
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to encrypt your private key"
                    className="pr-10 rounded-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pr-10 rounded-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white hover:bg-gray-800 py-3 font-bold rounded-none"
              >
                <Key className="h-4 w-4 mr-2" />
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Your private key will be encrypted and stored securely in your browser.</p>
          <p className="mt-1">Make sure to remember your password!</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;