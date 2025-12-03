import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Key, Copy, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import KaspaLogo from '../icons/KaspaLogo';
import { toast } from 'sonner';

const LoginForm: React.FC = () => {
  const { login, generateNewKeyPair } = useAuth();
  const { theme } = useUserSettings();
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<{
    privateKey: string;
    publicKey: string;
    address: string;
  } | null>(null);

  const handleGenerateKeyPair = async () => {
    try {
      setLoading(true);
      const keys = await generateNewKeyPair();
      setGeneratedKeys(keys);
      setPrivateKey(keys.privateKey);
      toast.success('Identity generated!', {
        description: 'Your new identity has been generated',
        duration: 3000,
      });
    } catch (err) {
      toast.error('Generation failed!', {
        description: 'Failed to generate new identity',
        duration: 3000,
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Login failed', {
        description: 'Passwords do not match',
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await login(privateKey, password);
    } catch (err) {
      toast.error('Login failed', {
        description: err instanceof Error ? err.message : 'Login failed',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-16 p-4 overflow-y-auto">
      <div className="w-full max-w-md md:max-w-xl pb-8">
        <div className="text-center mb-8">
          <KaspaLogo className="h-20 w-20 mx-auto mb-4" isDarkTheme={theme === 'dark'} />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Your voice. Your ideas. Uncensored. 
          </h1>
          <p className="text-xl text-muted-foreground mt-3">Create your new account in one click</p>
        </div>

        <Card className="border border-border shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Private Key Input */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="privateKey" className="block text-base font-medium text-foreground">
                    Private Key
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="privateKey"
                    type={showPrivateKey ? 'text' : 'password'}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Generate your private key"
                    className={`text-base border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0 ${generatedKeys ? 'pr-20' : 'pr-10'}`}
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

              {/* Key Generation Section */}
              {!privateKey.trim() && (
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={handleGenerateKeyPair}
                    disabled={loading}
                    className="text-base w-full py-3 font-bold"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-loader-circle' : ''}`} />
                    Generate New Identity
                  </Button>
                </div>
              )}

              {/* Password Input */}
              {privateKey.trim() && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <label htmlFor="password" className="block text-base font-medium text-foreground">
                      Password (for encryption)
                    </label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          window.scrollBy(0, -100);
                        }, 300);
                      }}
                      placeholder="Enter password to encrypt your private key"
                      maxLength={50}
                      className="text-base pr-10 border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
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
              )}

              {/* Confirm Password Input */}
              {privateKey.trim() && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <label htmlFor="confirmPassword" className="block text-base font-medium text-foreground">
                      Confirm Password
                    </label>
                  </div>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          window.scrollBy(0, -100);
                        }, 300);
                      }}
                      placeholder="Confirm your password"
                      maxLength={50}
                      className="text-base pr-10 border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
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
              )}

              {privateKey.trim() && (
                <div className="pt-4 border-t border-border space-y-2">
                  <Button
                    type="submit"
                    disabled={loading || !privateKey.trim() || !password.trim() || !confirmPassword.trim()}
                    className="text-base w-full py-3 font-bold"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;